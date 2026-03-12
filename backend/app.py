from flask import Flask, flash, jsonify, render_template, request, redirect, url_for, session
from flask_mysqldb import MySQL
from flask_cors import CORS
import MySQLdb

app = Flask(__name__)
app.secret_key = 'rhms_secret_key'

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'

mysql = MySQL(app)

# Allow React dev server to call /api/* endpoints
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})


def get_cursor():
    return mysql.connection.cursor()


def _row_to_house(row):
    # houses: id, house_number, status
    return {
        "id": row[0],
        "house_number": row[1],
        "status": row[2],
    }


def _row_to_tenant(row):
    # tenants: id, name, national_id, phone, email, house_number, move_in_date
    return {
        "id": row[0],
        "name": row[1],
        "national_id": row[2],
        "phone": row[3],
        "email": row[4],
        "house_number": row[5],
        "move_in_date": row[6].isoformat() if row[6] else None,
    }


@app.route('/')
def home():
    return render_template("login.html")


@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '')
    password = request.form.get('password', '')
    if username == "admin" and password == "1234":
        session['logged_in'] = True
        return redirect(url_for('dashboard'))
    return render_template("login.html", error="Invalid login credentials")


@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    stats = {'total_tenants': 0, 'total_houses': 0, 'occupied_houses': 0, 'payments_mtd': 0, 'monthly_data': []}
    recent_transactions = []
    try:
        cur = get_cursor()
        cur.execute("SELECT COUNT(*) FROM tenants")
        stats['total_tenants'] = cur.fetchone()[0] or 0
        cur.execute("SELECT COUNT(*) FROM houses")
        stats['total_houses'] = cur.fetchone()[0] or 0
        cur.execute("SELECT COUNT(*) FROM houses WHERE status='Occupied'")
        stats['occupied_houses'] = cur.fetchone()[0] or 0
        cur.execute("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE MONTH(payment_date)=MONTH(CURRENT_DATE()) AND YEAR(payment_date)=YEAR(CURRENT_DATE())")
        row = cur.fetchone()
        stats['payments_mtd'] = float(row[0]) if row and row[0] else 0
        cur.execute("""
            SELECT t.name, p.amount, p.payment_date, p.payment_method
            FROM payments p
            JOIN tenants t ON t.id = p.tenant_id
            ORDER BY p.payment_date DESC, p.id DESC
            LIMIT 8
        """)
        recent_transactions = cur.fetchall()
        cur.close()
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        pass
    return render_template("dashboard.html", stats=stats, recent_transactions=recent_transactions)


@app.route('/add_tenant', methods=['GET', 'POST'])
def add_tenant():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    cur = get_cursor()
    try:
        cur.execute("SELECT house_number FROM houses WHERE status='Vacant'")
        houses = cur.fetchall()
    except MySQLdb.ProgrammingError:
        houses = []
    if request.method == 'POST':
        name = request.form.get('name')
        national_id = request.form.get('national_id')
        phone = request.form.get('phone')
        email = request.form.get('email')
        house_number = request.form.get('house_number')
        move_in_date = request.form.get('move_in_date')
        if not all([name, national_id, phone, email, house_number, move_in_date]):
            return render_template("add_tenant.html", houses=houses, error="All fields required")
        try:
            cur.execute(
                "INSERT INTO tenants(name,national_id,phone,email,house_number,move_in_date) VALUES(%s,%s,%s,%s,%s,%s)",
                (name, national_id, phone, email, house_number, move_in_date)
            )
            cur.execute("UPDATE houses SET status='Occupied' WHERE house_number=%s", (house_number,))
            mysql.connection.commit()
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
        except MySQLdb.IntegrityError:
            mysql.connection.rollback()
        finally:
            cur.close()
        return redirect(url_for('tenants'))
    return render_template("add_tenant.html", houses=houses)


@app.route('/tenants')
def tenants():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM tenants")
        data = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        data = []
    return render_template("tenants.html", tenants=data)


@app.route('/tenants/<int:tenant_id>/edit', methods=['GET', 'POST'])
def edit_tenant(tenant_id: int):
    if not session.get('logged_in'):
        return redirect(url_for('home'))

    error = None
    tenant_row = None
    houses_list = []

    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM tenants WHERE id=%s", (tenant_id,))
        tenant_row = cur.fetchone()
        cur.execute("SELECT house_number FROM houses")
        houses_list = cur.fetchall()
        cur.close()
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        tenant_row = None
        houses_list = []

    if not tenant_row:
        flash("Tenant not found.", "error")
        return redirect(url_for('tenants'))

    if request.method == 'POST':
        name = (request.form.get('name') or '').strip()
        national_id = (request.form.get('national_id') or '').strip()
        phone = (request.form.get('phone') or '').strip()
        email = (request.form.get('email') or '').strip()
        house_number = (request.form.get('house_number') or '').strip()
        move_in_date = (request.form.get('move_in_date') or '').strip()

        if not all([name, national_id, phone, email, house_number, move_in_date]):
            error = "All fields required"
        else:
            old_house = tenant_row[5]
            try:
                cur = get_cursor()
                cur.execute(
                    "UPDATE tenants SET name=%s, national_id=%s, phone=%s, email=%s, house_number=%s, move_in_date=%s WHERE id=%s",
                    (name, national_id, phone, email, house_number, move_in_date, tenant_id),
                )
                if old_house != house_number:
                    cur.execute("UPDATE houses SET status='Vacant' WHERE house_number=%s", (old_house,))
                    cur.execute("UPDATE houses SET status='Occupied' WHERE house_number=%s", (house_number,))
                mysql.connection.commit()
                cur.close()
                flash("Tenant updated.", "success")
                return redirect(url_for('tenants'))
            except (MySQLdb.ProgrammingError, MySQLdb.IntegrityError, MySQLdb.OperationalError):
                mysql.connection.rollback()
                error = "Could not update tenant. National ID may already exist or house is invalid."

    return render_template("tenant_edit.html", tenant=tenant_row, houses=houses_list, error=error)


@app.route('/tenants/<int:tenant_id>/delete', methods=['POST'])
def delete_tenant(tenant_id: int):
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT house_number FROM tenants WHERE id=%s", (tenant_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            flash("Tenant not found.", "error")
            return redirect(url_for('tenants'))

        house_number = row[0]
        cur.execute("SELECT COUNT(*) FROM payments WHERE tenant_id=%s", (tenant_id,))
        has_payments = (cur.fetchone()[0] or 0) > 0
        if has_payments:
            cur.close()
            flash("Cannot delete tenant with payments. Delete payments first.", "error")
            return redirect(url_for('tenants'))

        cur.execute("DELETE FROM tenants WHERE id=%s", (tenant_id,))
        cur.execute("UPDATE houses SET status='Vacant' WHERE house_number=%s", (house_number,))
        mysql.connection.commit()
        cur.close()
        flash("Tenant deleted.", "success")
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        mysql.connection.rollback()
        flash("Could not delete tenant.", "error")
    return redirect(url_for('tenants'))


@app.route('/houses', methods=['GET', 'POST'])
def houses():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    cur = get_cursor()
    try:
        cur.execute("SELECT * FROM houses")
        houses_list = cur.fetchall()
    except MySQLdb.ProgrammingError:
        houses_list = []
    if request.method == 'POST':
        house_number = request.form.get('house_number')
        status = request.form.get('status', 'Vacant')
        if house_number:
            try:
                cur.execute(
                    "INSERT INTO houses(house_number, status) VALUES(%s,%s)",
                    (house_number, status)
                )
                mysql.connection.commit()
            except (MySQLdb.ProgrammingError, MySQLdb.IntegrityError):
                mysql.connection.rollback()
            try:
                cur.execute("SELECT * FROM houses")
                houses_list = cur.fetchall()
            except MySQLdb.ProgrammingError:
                houses_list = []
        return redirect(url_for('houses'))
    cur.close()
    return render_template("houses.html", houses=houses_list)


@app.route('/payments')
def payments():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM payments")
        payments_list = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        payments_list = []
    return render_template("payments.html", payments=payments_list)


@app.route('/api/houses')
def api_houses():
    """Public JSON endpoint: list houses, optional ?vacant=1 to filter."""
    vacant_only = request.args.get("vacant") == "1"
    try:
        cur = get_cursor()
        if vacant_only:
            cur.execute("SELECT * FROM houses WHERE status='Vacant'")
        else:
            cur.execute("SELECT * FROM houses")
        rows = cur.fetchall()
        cur.close()
        return jsonify([_row_to_house(r) for r in rows]), 200
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        return jsonify({"error": "Could not load houses"}), 500


@app.route('/api/tenants', methods=['POST'])
def api_create_tenant():
    """Public JSON endpoint: register a tenant."""
    data = request.get_json(silent=True) or {}
    required = ["name", "national_id", "phone", "email", "house_number", "move_in_date"]
    missing = [f for f in required if not str(data.get(f) or "").strip()]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    name = data["name"].strip()
    national_id = data["national_id"].strip()
    phone = data["phone"].strip()
    email = data["email"].strip()
    house_number = data["house_number"].strip()
    move_in_date = data["move_in_date"].strip()

    try:
        cur = get_cursor()
        # Ensure house exists and is vacant
        cur.execute("SELECT status FROM houses WHERE house_number=%s", (house_number,))
        row = cur.fetchone()
        if not row:
            cur.close()
            return jsonify({"error": "Selected house does not exist"}), 400
        if row[0] != "Vacant":
            cur.close()
            return jsonify({"error": "Selected house is not vacant"}), 400

        # Insert tenant
        cur.execute(
            "INSERT INTO tenants(name,national_id,phone,email,house_number,move_in_date) "
            "VALUES(%s,%s,%s,%s,%s,%s)",
            (name, national_id, phone, email, house_number, move_in_date),
        )
        # Mark house occupied
        cur.execute("UPDATE houses SET status='Occupied' WHERE house_number=%s", (house_number,))
        mysql.connection.commit()

        # Fetch created tenant
        cur.execute(
            "SELECT id, name, national_id, phone, email, house_number, move_in_date "
            "FROM tenants WHERE national_id=%s",
            (national_id,),
        )
        created = cur.fetchone()
        cur.close()
        return jsonify({"tenant": _row_to_tenant(created)}), 201
    except MySQLdb.IntegrityError:
        mysql.connection.rollback()
        return jsonify({"error": "Tenant with this national ID already exists"}), 400
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        mysql.connection.rollback()
        return jsonify({"error": "Could not create tenant"}), 500


@app.route('/add_payment', methods=['GET', 'POST'])
def add_payment():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT id, name FROM tenants")
        tenants_list = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        tenants_list = []
    if request.method == 'POST':
        tenant_id = request.form.get('tenant_id')
        amount = request.form.get('amount')
        payment_date = request.form.get('payment_date')
        payment_method = request.form.get('payment_method', 'Cash')
        if tenant_id and amount and payment_date:
            try:
                cur = get_cursor()
                cur.execute(
                    "INSERT INTO payments(tenant_id, amount, payment_date, payment_method) VALUES(%s,%s,%s,%s)",
                    (tenant_id, amount, payment_date, payment_method)
                )
                mysql.connection.commit()
                cur.close()
            except MySQLdb.ProgrammingError:
                mysql.connection.rollback()
            return redirect(url_for('payments'))
    return render_template("add_payment.html", tenants=tenants_list)


@app.route('/reports')
def reports():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template("reports.html")


@app.route('/maintenance', methods=['GET', 'POST'])
def maintenance():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    error = None
    houses_list = []
    maintenance_list = []

    if request.method == 'POST':
        tenant = (request.form.get('tenant') or '').strip() or None
        house_number = (request.form.get('house_number') or '').strip()
        issue = (request.form.get('issue') or '').strip()
        status = (request.form.get('status') or 'Open').strip() or 'Open'

        if not house_number or not issue:
            error = "House and issue are required."
        else:
            try:
                cur = get_cursor()
                cur.execute(
                    "INSERT INTO maintenance(tenant, house_number, issue, status) VALUES(%s,%s,%s,%s)",
                    (tenant, house_number, issue, status),
                )
                mysql.connection.commit()
                cur.close()
                flash("Maintenance request submitted.", "success")
                return redirect(url_for('maintenance'))
            except (MySQLdb.ProgrammingError, MySQLdb.IntegrityError, MySQLdb.OperationalError):
                mysql.connection.rollback()
                error = "Could not submit maintenance request. Please check the selected house exists."

    # Load dropdown houses + current list
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM houses")
        houses_list = cur.fetchall()
        cur.execute("SELECT * FROM maintenance ORDER BY id DESC")
        maintenance_list = cur.fetchall()
        cur.close()
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        houses_list = []
        maintenance_list = []

    return render_template(
        "maintenance.html",
        maintenance_list=maintenance_list,
        houses=houses_list,
        error=error,
    )


@app.route('/maintenance/<int:maintenance_id>/edit', methods=['GET', 'POST'])
def edit_maintenance(maintenance_id: int):
    if not session.get('logged_in'):
        return redirect(url_for('home'))

    error = None
    houses_list = []
    maintenance_row = None

    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM houses")
        houses_list = cur.fetchall()
        cur.execute("SELECT * FROM maintenance WHERE id=%s", (maintenance_id,))
        maintenance_row = cur.fetchone()
        cur.close()
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        maintenance_row = None
        houses_list = []

    if not maintenance_row:
        return redirect(url_for('maintenance'))

    if request.method == 'POST':
        tenant = (request.form.get('tenant') or '').strip() or None
        house_number = (request.form.get('house_number') or '').strip()
        issue = (request.form.get('issue') or '').strip()
        status = (request.form.get('status') or 'Open').strip() or 'Open'

        if not house_number or not issue:
            error = "House and issue are required."
        else:
            try:
                cur = get_cursor()
                cur.execute(
                    "UPDATE maintenance SET tenant=%s, house_number=%s, issue=%s, status=%s WHERE id=%s",
                    (tenant, house_number, issue, status, maintenance_id),
                )
                mysql.connection.commit()
                cur.close()
                flash("Maintenance request updated.", "success")
                return redirect(url_for('maintenance'))
            except (MySQLdb.ProgrammingError, MySQLdb.IntegrityError, MySQLdb.OperationalError):
                mysql.connection.rollback()
                error = "Could not update maintenance request. Please check the selected house exists."

    return render_template(
        "maintenance_edit.html",
        m=maintenance_row,
        houses=houses_list,
        error=error,
    )


@app.route('/maintenance/<int:maintenance_id>/delete', methods=['POST'])
def delete_maintenance(maintenance_id: int):
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("DELETE FROM maintenance WHERE id=%s", (maintenance_id,))
        mysql.connection.commit()
        cur.close()
        flash("Maintenance request deleted.", "success")
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        mysql.connection.rollback()
        flash("Could not delete maintenance request.", "error")
    return redirect(url_for('maintenance'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(debug=True)
