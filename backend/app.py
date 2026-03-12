from flask import Flask, render_template, request, redirect, url_for, session
from flask_mysqldb import MySQL
import MySQLdb

app = Flask(__name__)
app.secret_key = 'rhms_secret_key'

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'

mysql = MySQL(app)


def get_cursor():
    return mysql.connection.cursor()


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
        cur.execute("SELECT name, move_in_date FROM tenants ORDER BY move_in_date DESC LIMIT 8")
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


@app.route('/maintenance')
def maintenance():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM maintenance")
        maintenance_list = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        maintenance_list = []
    return render_template("maintenance.html", maintenance_list=maintenance_list)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(debug=True)
