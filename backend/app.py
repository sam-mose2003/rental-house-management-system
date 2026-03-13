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
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5176", "http://127.0.0.1:5176"]}})


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
    # tenants: id, name, national_id, phone, email, house_number, move_in_date, status
    return {
        "id": row[0],
        "name": row[1],
        "national_id": row[2],
        "phone": row[3],
        "email": row[4],
        "house_number": row[5],
        "move_in_date": row[6].isoformat() if row[6] else None,
        "status": row[7] if len(row) > 7 else 'approved',
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
    
    # Get houses list with tenant info
    try:
        cur.execute("""
            SELECT h.id, h.house_number, h.status, t.name 
            FROM houses h 
            LEFT JOIN tenants t ON h.house_number = t.house_number AND t.status = 'approved'
            ORDER BY h.house_number
        """)
        houses_list = cur.fetchall()
    except MySQLdb.ProgrammingError:
        houses_list = []
    
    # Get pending tenant requests
    try:
        cur.execute("""
            SELECT t.id, t.name, t.house_number, t.national_id, t.phone, t.email, t.move_in_date
            FROM tenants t 
            WHERE t.status = 'pending'
            ORDER BY t.created_at DESC
        """)
        pending_requests = cur.fetchall()
    except MySQLdb.ProgrammingError:
        pending_requests = []
    
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
                flash('House added successfully!', 'success')
            except (MySQLdb.ProgrammingError, MySQLdb.IntegrityError):
                mysql.connection.rollback()
                flash('House number already exists!', 'error')
            # Refresh houses list
            try:
                cur.execute("""
                    SELECT h.id, h.house_number, h.status, t.name 
                    FROM houses h 
                    LEFT JOIN tenants t ON h.house_number = t.house_number AND t.status = 'approved'
                    ORDER BY h.house_number
                """)
                houses_list = cur.fetchall()
            except MySQLdb.ProgrammingError:
                houses_list = []
        return redirect(url_for('houses'))
    
    cur.close()
    return render_template("houses.html", houses=houses_list, pending_requests=pending_requests)


@app.route('/approve_tenant_request', methods=['POST'])
def approve_tenant_request():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    tenant_id = request.form.get('tenant_id')
    
    if tenant_id:
        cur = get_cursor()
        try:
            # Get tenant info
            cur.execute("SELECT house_number FROM tenants WHERE id = %s", (tenant_id,))
            tenant_info = cur.fetchone()
            
            if tenant_info:
                house_number = tenant_info[0]
                
                # Approve tenant
                cur.execute("UPDATE tenants SET status = 'approved' WHERE id = %s", (tenant_id,))
                
                # Update house status to occupied
                cur.execute("UPDATE houses SET status = 'Occupied' WHERE house_number = %s", (house_number,))
                
                mysql.connection.commit()
                flash(f'Tenant request approved! House {house_number} is now occupied.', 'success')
            else:
                flash('Tenant not found!', 'error')
                
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
            flash('Failed to approve tenant request!', 'error')
        finally:
            cur.close()
    
    return redirect(url_for('houses'))


@app.route('/reject_tenant_request', methods=['POST'])
def reject_tenant_request():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    tenant_id = request.form.get('tenant_id')
    
    if tenant_id:
        cur = get_cursor()
        try:
            # Get tenant info
            cur.execute("SELECT name, house_number FROM tenants WHERE id = %s", (tenant_id,))
            tenant_info = cur.fetchone()
            
            if tenant_info:
                name, house_number = tenant_info
                
                # Delete tenant record (or update status to rejected)
                cur.execute("DELETE FROM tenants WHERE id = %s", (tenant_id,))
                
                # Keep house as vacant
                cur.execute("UPDATE houses SET status = 'Vacant' WHERE house_number = %s", (house_number,))
                
                mysql.connection.commit()
                flash(f'Tenant request for {name} (House {house_number}) has been rejected.', 'success')
            else:
                flash('Tenant not found!', 'error')
                
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
            flash('Failed to reject tenant request!', 'error')
        finally:
            cur.close()
    
    return redirect(url_for('houses'))


@app.route('/delete_house', methods=['POST'])
def delete_house():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    house_id = request.form.get('house_id')
    
    if house_id:
        cur = get_cursor()
        try:
            # Check if house is occupied
            cur.execute("SELECT house_number, status FROM houses WHERE id = %s", (house_id,))
            house_info = cur.fetchone()
            
            if house_info and house_info[1] != 'Occupied':
                # Delete house
                cur.execute("DELETE FROM houses WHERE id = %s", (house_id,))
                mysql.connection.commit()
                flash('House deleted successfully!', 'success')
            else:
                flash('Cannot delete occupied house!', 'error')
                
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
            flash('Failed to delete house!', 'error')
        finally:
            cur.close()
    
    return redirect(url_for('houses'))


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

        # Insert tenant with pending status
        cur.execute(
            "INSERT INTO tenants(name,national_id,phone,email,house_number,move_in_date,status) "
            "VALUES(%s,%s,%s,%s,%s,%s,%s)",
            (name, national_id, phone, email, house_number, move_in_date, 'pending'),
        )
        # Don't mark house occupied until tenant is approved
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
        cur.execute("SELECT id, name, house_number FROM tenants WHERE status = 'approved'")
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
                flash('Payment added successfully!', 'success')
            except MySQLdb.ProgrammingError:
                mysql.connection.rollback()
                flash('Failed to add payment. Please try again.', 'error')
            return redirect(url_for('payments'))
    return render_template("payments.html", payments=get_payments(), tenants_list=tenants_list)


@app.route('/reports', methods=['GET', 'POST'])
def reports():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    report_data = None
    report_type = None
    
    if request.method == 'POST':
        report_type = request.form.get('report_type')
        cur = get_cursor()
        
        if report_type == 'rent_collection':
            # Rent Collection Report
            cur.execute("""
                SELECT p.id, t.name, p.amount, p.payment_date, p.payment_method 
                FROM payments p 
                JOIN tenants t ON p.tenant_id = t.id 
                ORDER BY p.payment_date DESC 
                LIMIT 50
            """)
            payments = cur.fetchall()
            
            total_collected = sum(p[2] for p in payments) if payments else 0
            average_payment = total_collected / len(payments) if payments else 0
            
            report_data = {
                'payments': payments,
                'total_collected': total_collected,
                'average_payment': average_payment
            }
            
        elif report_type == 'occupancy':
            # Occupancy Status Report
            cur.execute("""
                SELECT h.id, h.house_number, h.status, t.name 
                FROM houses h 
                LEFT JOIN tenants t ON h.house_number = t.house_number AND t.status = 'approved'
                ORDER BY h.house_number
            """)
            houses = cur.fetchall()
            
            total_houses = len(houses)
            occupied = sum(1 for h in houses if h[2] == 'Occupied')
            vacant = total_houses - occupied
            occupancy_rate = round((occupied / total_houses * 100), 1) if total_houses > 0 else 0
            
            report_data = {
                'houses': houses,
                'total_houses': total_houses,
                'occupied': occupied,
                'vacant': vacant,
                'occupancy_rate': occupancy_rate
            }
            
        elif report_type == 'outstanding':
            # Outstanding Rent Report
            cur.execute("""
                SELECT t.id, t.name, t.house_number, 10000 as expected_rent,
                       MAX(p.payment_date) as last_payment,
                       (10000 - COALESCE(SUM(p.amount), 0)) as outstanding
                FROM tenants t 
                LEFT JOIN payments p ON t.id = p.tenant_id 
                WHERE t.status = 'approved'
                GROUP BY t.id, t.name, t.house_number
                HAVING outstanding > 0
            """)
            tenants = cur.fetchall()
            
            total_outstanding = sum(t[5] for t in tenants) if tenants else 0
            
            report_data = {
                'tenants': tenants,
                'total_outstanding': total_outstanding
            }
            
        elif report_type == 'tenant_list':
            # Tenant List Report
            cur.execute("""
                SELECT t.id, t.name, t.house_number, t.national_id, t.phone, t.status, t.move_in_date
                FROM tenants t 
                ORDER BY t.name
            """)
            tenants = cur.fetchall()
            
            approved_count = sum(1 for t in tenants if t[5] == 'approved')
            pending_count = sum(1 for t in tenants if t[5] == 'pending')
            
            report_data = {
                'tenants': tenants,
                'approved_count': approved_count,
                'pending_count': pending_count
            }
            
        elif report_type == 'payment_summary':
            # Payment Summary Report
            cur.execute("""
                SELECT payment_method, COUNT(*) as count, SUM(amount) as total
                FROM payments 
                GROUP BY payment_method 
                ORDER BY total DESC
            """)
            methods = cur.fetchall()
            
            total_amount = sum(m[2] for m in methods) if methods else 0
            total_count = sum(m[1] for m in methods) if methods else 0
            average_amount = total_amount / total_count if total_count > 0 else 0
            
            # Calculate percentages
            method_breakdown = []
            for method in methods:
                percentage = round((method[2] / total_amount * 100), 1) if total_amount > 0 else 0
                method_breakdown.append((method[0], method[1], method[2], percentage))
            
            report_data = {
                'method_breakdown': method_breakdown,
                'total_amount': total_amount,
                'total_count': total_count,
                'average_amount': average_amount
            }
        
        cur.close()
    
    return render_template("reports.html", report_data=report_data, report_type=report_type)


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


# ===== NEW ADMIN DASHBOARD API ROUTES =====

@app.route('/api/dashboard-stats')
def api_dashboard_stats():
    """Get dashboard statistics for admin dashboard"""
    try:
        cur = get_cursor()
        
        # Get total tenants
        cur.execute("SELECT COUNT(*) FROM tenants")
        total_tenants = cur.fetchone()[0] or 0
        
        # Get total houses
        cur.execute("SELECT COUNT(*) FROM houses")
        total_houses = cur.fetchone()[0] or 0
        
        # Get total payments
        cur.execute("SELECT COALESCE(SUM(amount), 0) FROM payments")
        result = cur.fetchone()
        total_payments = float(result[0]) if result[0] else 0
        
        # Get pending tenant approvals (assuming status column exists)
        try:
            cur.execute("SELECT COUNT(*) FROM tenants WHERE status = 'pending'")
            pending_approvals = cur.fetchone()[0] or 0
        except MySQLdb.ProgrammingError:
            # Fallback if status column doesn't exist
            pending_approvals = 0
        
        cur.close()
        
        return jsonify({
            "totalTenants": total_tenants,
            "totalHouses": total_houses,
            "totalPayments": total_payments,
            "pendingApprovals": pending_approvals
        })
    except Exception as e:
        return jsonify({"error": "Could not fetch dashboard stats"}), 500


@app.route('/api/tenants')
def api_get_tenants():
    """Get all approved tenants"""
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT id, name, national_id, phone, email, house_number, move_in_date, status
            FROM tenants 
            WHERE status != 'pending' OR status IS NULL
            ORDER BY id DESC
        """)
        tenants = []
        for row in cur.fetchall():
            tenants.append(_row_to_tenant(row))
        cur.close()
        return jsonify(tenants)
    except Exception as e:
        return jsonify({"error": "Could not fetch tenants"}), 500


@app.route('/api/pending-tenants')
def api_get_pending_tenants():
    """Get tenants pending approval"""
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT id, name, national_id, phone, email, house_number, move_in_date, status
            FROM tenants 
            WHERE status = 'pending'
            ORDER BY move_in_date DESC
        """)
        tenants = []
        for row in cur.fetchall():
            tenants.append(_row_to_tenant(row))
        cur.close()
        return jsonify(tenants)
    except Exception as e:
        return jsonify({"error": "Could not fetch pending tenants"}), 500


@app.route('/api/approve-tenant/<int:tenant_id>', methods=['POST'])
def api_approve_tenant(tenant_id):
    """Approve a tenant registration"""
    try:
        cur = get_cursor()
        cur.execute("UPDATE tenants SET status = 'approved' WHERE id = %s", (tenant_id,))
        mysql.connection.commit()
        
        # Update house status to occupied
        cur.execute("UPDATE houses SET status = 'Occupied' WHERE house_number = (SELECT house_number FROM tenants WHERE id = %s)", (tenant_id,))
        mysql.connection.commit()
        
        cur.close()
        return jsonify({"success": True, "message": "Tenant approved successfully"})
    except Exception as e:
        return jsonify({"error": "Could not approve tenant"}), 500


@app.route('/api/reject-tenant/<int:tenant_id>', methods=['POST'])
def api_reject_tenant(tenant_id):
    """Reject a tenant registration"""
    try:
        cur = get_cursor()
        cur.execute("DELETE FROM tenants WHERE id = %s", (tenant_id,))
        mysql.connection.commit()
        cur.close()
        return jsonify({"success": True, "message": "Tenant rejected successfully"})
    except Exception as e:
        return jsonify({"error": "Could not reject tenant"}), 500


@app.route('/api/payments')
def api_get_payments():
    """Get all payments with tenant information"""
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT p.id, p.tenant_id, p.amount, p.payment_date, p.payment_method,
                   t.name as tenant_name
            FROM payments p
            JOIN tenants t ON t.id = p.tenant_id
            ORDER BY p.payment_date DESC, p.id DESC
        """)
        payments = []
        for row in cur.fetchall():
            payments.append({
                "id": row[0],
                "tenant_id": row[1],
                "amount": float(row[2]),
                "payment_date": row[3].isoformat() if row[3] else None,
                "payment_method": row[4],
                "tenant_name": row[5]
            })
        cur.close()
        return jsonify(payments)
    except Exception as e:
        return jsonify({"error": "Could not fetch payments"}), 500


@app.route('/api/add-payment', methods=['POST'])
def api_add_payment():
    """Add a new payment"""
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        amount = data.get('amount')
        payment_method = data.get('payment_method', 'Cash')
        payment_date = data.get('payment_date')
        
        if not all([tenant_id, amount, payment_date]):
            return jsonify({"error": "Missing required fields"}), 400
        
        cur = get_cursor()
        cur.execute("""
            INSERT INTO payments (tenant_id, amount, payment_method, payment_date)
            VALUES (%s, %s, %s, %s)
        """, (tenant_id, amount, payment_method, payment_date))
        mysql.connection.commit()
        
        # Get the created payment
        payment_id = cur.lastrowid
        cur.execute("""
            SELECT p.id, p.tenant_id, p.amount, p.payment_date, p.payment_method,
                   t.name as tenant_name
            FROM payments p
            JOIN tenants t ON t.id = p.tenant_id
            WHERE p.id = %s
        """, (payment_id,))
        row = cur.fetchone()
        
        payment = {
            "id": row[0],
            "tenant_id": row[1],
            "amount": float(row[2]),
            "payment_date": row[3].isoformat() if row[3] else None,
            "payment_method": row[4],
            "tenant_name": row[5]
        }
        
        cur.close()
        return jsonify(payment)
    except Exception as e:
        return jsonify({"error": "Could not add payment"}), 500


@app.route('/api/maintenance-requests')
def api_get_maintenance_requests():
    """Get all maintenance requests"""
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT id, tenant, house_number, issue, status
            FROM maintenance
            ORDER BY 
                CASE WHEN status = 'Open' THEN 0 ELSE 1 END,
                id DESC
        """)
        requests = []
        for row in cur.fetchall():
            requests.append({
                "id": row[0],
                "tenant": row[1],
                "house_number": row[2],
                "issue": row[3],
                "status": row[4],
                "created_at": None  # Would need to add created_at column to maintenance table
            })
        cur.close()
        return jsonify(requests)
    except Exception as e:
        return jsonify({"error": "Could not fetch maintenance requests"}), 500


@app.route('/api/resolve-maintenance/<int:request_id>', methods=['POST'])
def api_resolve_maintenance(request_id):
    """Mark maintenance request as resolved"""
    try:
        cur = get_cursor()
        cur.execute("UPDATE maintenance SET status = 'Resolved' WHERE id = %s", (request_id,))
        mysql.connection.commit()
        cur.close()
        return jsonify({"success": True, "message": "Maintenance request resolved"})
    except Exception as e:
        return jsonify({"error": "Could not resolve maintenance request"}), 500


# ===== HOUSE MANAGEMENT APIS =====

@app.route('/api/houses', methods=['POST'])
def api_add_house():
    """Add a new house"""
    try:
        data = request.get_json()
        house_number = data.get('house_number', '').strip()
        status = data.get('status', 'Vacant')
        
        if not house_number:
            return jsonify({"error": "House number is required"}), 400
        
        cur = get_cursor()
        # Check if house already exists
        cur.execute("SELECT id FROM houses WHERE house_number = %s", (house_number,))
        if cur.fetchone():
            cur.close()
            return jsonify({"error": "House number already exists"}), 400
        
        # Insert new house
        cur.execute(
            "INSERT INTO houses (house_number, status) VALUES (%s, %s)",
            (house_number, status)
        )
        mysql.connection.commit()
        
        # Get created house
        house_id = cur.lastrowid
        cur.execute("SELECT * FROM houses WHERE id = %s", (house_id,))
        row = cur.fetchone()
        cur.close()
        
        return jsonify(_row_to_house(row)), 201
        
    except Exception as e:
        return jsonify({"error": "Could not add house"}), 500


@app.route('/api/houses/<int:house_id>', methods=['DELETE'])
def api_delete_house(house_id):
    """Delete a house"""
    try:
        cur = get_cursor()
        # Check if house exists
        cur.execute("SELECT house_number FROM houses WHERE id = %s", (house_id,))
        house = cur.fetchone()
        if not house:
            cur.close()
            return jsonify({"error": "House not found"}), 404
        
        # Check if house is occupied by a tenant
        cur.execute("SELECT id FROM tenants WHERE house_number = %s AND status = 'approved'", (house[0],))
        tenant = cur.fetchone()
        if tenant:
            cur.close()
            return jsonify({"error": "Cannot delete house that is occupied by a tenant"}), 400
        
        # Delete the house
        cur.execute("DELETE FROM houses WHERE id = %s", (house_id,))
        mysql.connection.commit()
        cur.close()
        
        return jsonify({"success": True, "message": "House deleted successfully"})
        
    except Exception as e:
        return jsonify({"error": "Could not delete house"}), 500


# ===== TENANT DASHBOARD APIS =====

@app.route('/api/tenant-payment', methods=['POST'])
def api_tenant_payment():
    """Allow tenant to submit payment"""
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        amount = data.get('amount')
        payment_method = data.get('payment_method', 'Cash')
        payment_date = data.get('payment_date')
        
        if not all([tenant_id, amount, payment_date]):
            return jsonify({"error": "Missing required fields"}), 400
        
        cur = get_cursor()
        # Verify tenant exists and is approved
        cur.execute("SELECT status FROM tenants WHERE id = %s", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant:
            cur.close()
            return jsonify({"error": "Tenant not found"}), 404
        if tenant[0] != 'approved':
            cur.close()
            return jsonify({"error": "Tenant account is not approved"}), 403
        
        # Insert payment
        cur.execute("""
            INSERT INTO payments (tenant_id, amount, payment_method, payment_date)
            VALUES (%s, %s, %s, %s)
        """, (tenant_id, amount, payment_method, payment_date))
        mysql.connection.commit()
        
        # Get created payment
        payment_id = cur.lastrowid
        cur.execute("""
            SELECT p.id, p.amount, p.payment_date, p.payment_method
            FROM payments p
            WHERE p.id = %s
        """, (payment_id,))
        row = cur.fetchone()
        
        payment = {
            "id": row[0],
            "amount": float(row[1]),
            "payment_date": row[2].isoformat() if row[2] else None,
            "payment_method": row[3]
        }
        
        cur.close()
        return jsonify(payment)
    except Exception as e:
        return jsonify({"error": "Could not submit payment"}), 500


@app.route('/api/maintenance-request', methods=['POST'])
def api_maintenance_request():
    """Allow tenant to submit maintenance request"""
    try:
        data = request.get_json()
        tenant_id = data.get('tenant_id')
        tenant_name = data.get('tenant')
        house_number = data.get('house_number')
        issue = data.get('issue')
        priority = data.get('priority', 'Normal')
        
        if not all([tenant_id, tenant_name, house_number, issue]):
            return jsonify({"error": "Missing required fields"}), 400
        
        cur = get_cursor()
        # Verify tenant exists and is approved
        cur.execute("SELECT status FROM tenants WHERE id = %s", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant:
            cur.close()
            return jsonify({"error": "Tenant not found"}), 404
        if tenant[0] != 'approved':
            cur.close()
            return jsonify({"error": "Tenant account is not approved"}), 403
        
        # Insert maintenance request
        cur.execute("""
            INSERT INTO maintenance (tenant, house_number, issue, status)
            VALUES (%s, %s, %s, %s)
        """, (tenant_name, house_number, issue, 'Open'))
        mysql.connection.commit()
        
        # Get created request
        request_id = cur.lastrowid
        cur.execute("""
            SELECT id, tenant, house_number, issue, status, created_at
            FROM maintenance
            WHERE id = %s
        """, (request_id,))
        row = cur.fetchone()
        
        request_data = {
            "id": row[0],
            "tenant": row[1],
            "house_number": row[2],
            "issue": row[3],
            "status": row[4],
            "created_at": row[5].isoformat() if row[5] else None
        }
        
        cur.close()
        return jsonify(request_data)
    except Exception as e:
        return jsonify({"error": "Could not submit maintenance request"}), 500


@app.route('/api/tenant-payments/<int:tenant_id>')
def api_tenant_payments(tenant_id):
    """Get payments for a specific tenant"""
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT id, amount, payment_date, payment_method
            FROM payments
            WHERE tenant_id = %s
            ORDER BY payment_date DESC, id DESC
        """, (tenant_id,))
        
        payments = []
        for row in cur.fetchall():
            payments.append({
                "id": row[0],
                "amount": float(row[1]),
                "payment_date": row[2].isoformat() if row[2] else None,
                "payment_method": row[3]
            })
        cur.close()
        return jsonify(payments)
    except Exception as e:
        return jsonify({"error": "Could not fetch tenant payments"}), 500


@app.route('/api/tenant-maintenance/<int:tenant_id>')
def api_tenant_maintenance(tenant_id):
    """Get maintenance requests for a specific tenant"""
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT id, tenant, house_number, issue, status, created_at
            FROM maintenance
            WHERE tenant = (SELECT name FROM tenants WHERE id = %s)
            ORDER BY created_at DESC, id DESC
        """, (tenant_id,))
        
        requests = []
        for row in cur.fetchall():
            requests.append({
                "id": row[0],
                "tenant": row[1],
                "house_number": row[2],
                "issue": row[3],
                "status": row[4],
                "created_at": row[5].isoformat() if row[5] else None
            })
        cur.close()
        return jsonify(requests)
    except Exception as e:
        return jsonify({"error": "Could not fetch tenant maintenance requests"}), 500


if __name__ == "__main__":
    app.run(debug=True)
