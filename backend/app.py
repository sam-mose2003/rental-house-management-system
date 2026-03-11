from flask import Flask, render_template, request, redirect, url_for, session
from flask_mysqldb import MySQL

app = Flask(__name__)
app.secret_key = 'rhms_secret_key'

# Database configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'

mysql = MySQL(app)


@app.route('/')
def home():
    return render_template("login.html")


@app.route('/login', methods=['POST'])
def login():

    username = request.form['username']
    password = request.form['password']

    if username == "admin" and password == "1234":
        session['logged_in'] = True
        return redirect(url_for('dashboard'))

    return "Invalid login credentials"



@app.route('/dashboard')
def dashboard():

    if not session.get('logged_in'):
        return redirect(url_for('home'))

    return render_template("dashboard.html")


# ---------------- ADD TENANT ----------------
@app.route('/add_tenant', methods=['GET','POST'])
def add_tenant():

    if not session.get('logged_in'):
        return redirect(url_for('home'))

    if request.method == 'POST':

        name = request.form['name']
        national_id = request.form['national_id']
        phone = request.form['phone']
        email = request.form['email']
        house_number = request.form['house_number']
        move_in_date = request.form['move_in_date']

        cur = mysql.connection.cursor()

        cur.execute(
        "INSERT INTO tenants(name,national_id,phone,email,house_number,move_in_date) VALUES(%s,%s,%s,%s,%s,%s)",
        (name,national_id,phone,email,house_number,move_in_date)
        )

        mysql.connection.commit()
        cur.close()

        return redirect(url_for('tenants'))

    return render_template("add_tenant.html")


# ---------------- VIEW TENANTS ----------------
@app.route('/tenants')
def tenants():

    if not session.get('logged_in'):
        return redirect(url_for('home'))

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM tenants")
    data = cur.fetchall()
    cur.close()

    return render_template("tenants.html", tenants=data)


# ---------------- LOGOUT ----------------
@app.route('/logout')
def logout():

    session.clear()
    return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(debug=True)
    from flask import Flask, render_template

app = Flask(__name__)

# Route for Manage Houses
@app.route('/houses')
def houses():
    return render_template('houses.html')

# Route for Record Rent Payment
@app.route('/payments')
def payments():
    return render_template('payments.html')

# Route for View Reports
@app.route('/reports')
def reports():
    return render_template('reports.html')

# Route for Maintenance Requests
@app.route('/maintenance')
def maintenance():
    return render_template('maintenance.html')

if __name__ == '__main__':
    app.run(debug=True)