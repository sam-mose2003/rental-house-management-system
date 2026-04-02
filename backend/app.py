import psycopg2
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import hashlib
import time
import os
from flask_cors import CORS
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY

# PostgreSQL connection function
def get_db_connection():
    return psycopg2.connect(
        host=Config.POSTGRES_HOST,
        user=Config.POSTGRES_USER,
        password=Config.POSTGRES_PASSWORD,
        database=Config.POSTGRES_DB
    )

def get_cursor():
    conn = get_db_connection()
    return conn.cursor()

def commit_and_close(cursor, connection=None):
    if connection is None:
        connection = cursor.connection
    connection.commit()
    cursor.close()

def rollback_and_close(cursor, connection=None):
    if connection is None:
        connection = cursor.connection
    connection.rollback()
    cursor.close()

# Allow all origins for development
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5176", "http://127.0.0.1:5176", "*"], supports_credentials=True)

# Email configuration
EMAIL_CONFIG = {
    'SMTP_SERVER': Config.SMTP_SERVER,
    'SMTP_PORT': Config.SMTP_PORT,
    'SENDER_EMAIL': Config.SENDER_EMAIL,
    'SENDER_PASSWORD': Config.SENDER_PASSWORD,
    'ENABLED': Config.EMAIL_ENABLED
}

def send_approval_email(tenant_email, tenant_name, house_number):
    """Send approval email to tenant"""
    if not EMAIL_CONFIG['ENABLED']:
        print("Email sending is disabled")
        return False
    
    try:
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG['SENDER_EMAIL']
        msg['To'] = tenant_email
        msg['Subject'] = '🎉 Your House Application Has Been Approved!'
        
        # Email body
        body = f"""
Dear {tenant_name},

🎉 GOOD NEWS! Your rental application has been APPROVED! 🎉

House Details:
- House Number: {house_number}
- Status: Approved
- You can now access your tenant dashboard

Next Steps:
1. Log into your tenant dashboard
2. Make your first payment
3. Submit any maintenance requests if needed

Thank you for choosing our rental service!
We're excited to have you as our tenant.

Best regards,
RHMS Management Team
---
Rental House Management System
Contact: support@rhms.com
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(EMAIL_CONFIG['SMTP_SERVER'], EMAIL_CONFIG['SMTP_PORT'])
        server.starttls()
        server.login(EMAIL_CONFIG['SENDER_EMAIL'], EMAIL_CONFIG['SENDER_PASSWORD'])
        server.send_message(msg)
        server.quit()
        
        print(f"Approval email sent to {tenant_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def get_cursor():
    return mysql.connection.cursor()


def _row_to_house(row):
    """Convert a house row to a dictionary"""
    if not row:
        return None
    
    try:
        if len(row) >= 5:
            return {
                "id": int(row[0]),
                "house_number": str(row[1]),
                "status": str(row[2]),
                "price": float(row[3]) if row[3] is not None else 0.0,
                "house_type": str(row[4]) if row[4] is not None else "Single Room"
            }
        else:
            # Fallback for old data structure
            return {
                "id": int(row[0]),
                "house_number": str(row[1]),
                "status": str(row[2]),
                "price": float(row[3]) if len(row) > 3 and row[3] is not None else 0.0,
                "house_type": "Single Room"
            }
    except Exception as e:
        print(f"Error converting house row: {e}")
        return None


def _row_to_tenant(row):
    # tenants: id, name, national_id, phone, email, house_number, move_in_date, status
    if not row or len(row) < 6:
        return None
    
    try:
        return {
            "id": int(row[0]),
            "name": str(row[1]),
            "national_id": str(row[2]),
            "phone": str(row[3]),
            "email": str(row[4]),
            "house_number": str(row[5]),
            "move_in_date": row[6].strftime('%Y-%m-%d') if len(row) > 6 and row[6] else None,
            "status": str(row[7]) if len(row) > 7 else 'approved',
        }
    except Exception as e:
        print(f"Error converting tenant row: {e}")
        return None


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
    try:
        cur = get_cursor()
        cur.execute("SELECT house_number FROM houses WHERE status='Vacant'")
        houses = cur.fetchall()
    except MySQLdb.ProgrammingError as e:
        print(f"Database error: {e}")
        houses = []
    finally:
        cur.close()
    
    if request.method == 'POST':
        cur = get_cursor()
        name = request.form.get('name')
        national_id = request.form.get('national_id')
        phone = request.form.get('phone')
        email = request.form.get('email')
        house_number = request.form.get('house_number')
        move_in_date = request.form.get('move_in_date')
        if not all([name, national_id, phone, email, house_number, move_in_date]):
            cur.close()
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
        cur.execute("DELETE FROM tenants WHERE id=%s", (tenant_id,))
        cur.execute("UPDATE houses SET status='Vacant' WHERE house_number=%s", (house_number,))
        mysql.connection.commit()
        cur.close()
        flash("Tenant deleted successfully.", "success")
    except (MySQLdb.ProgrammingError, MySQLdb.OperationalError):
        flash("Error deleting tenant.", "error")
    return redirect(url_for('tenants'))


@app.route('/houses', methods=['GET', 'POST'])
def houses():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        # Handle adding a new house
        try:
            house_number = request.form.get('house_number', '').strip()
            price = request.form.get('price', 10000.00)
            house_type = request.form.get('house_type', 'Single Room')
            status = request.form.get('status', 'Vacant')
            
            if not house_number:
                return render_template("houses.html", houses=[], error="House number is required")
            
            cur = get_cursor()
            cur.execute(
                "INSERT INTO houses (house_number, status, price, house_type) VALUES (%s, %s, %s, %s)",
                (house_number, status, price, house_type)
            )
            mysql.connection.commit()
            cur.close()
            
            print(f"Successfully added house: {house_number}")
            flash("House added successfully!", "success")
            
            # Redirect to refresh the page
            return redirect(url_for('houses'))
        except Exception as e:
            print(f"Error adding house: {e}")
            return render_template("houses.html", houses=[], error="Could not add house")
    
    # Handle GET request - display houses and pending requests
    houses_data = []
    pending_requests = []
    
    try:
        cur = get_cursor()
        # Fetch houses
        cur.execute("SELECT * FROM houses")
        houses_data = cur.fetchall()
        
        # Fetch pending tenant requests
        cur.execute("""
            SELECT id, name, house_number, national_id, phone, email, move_in_date 
            FROM tenants 
            WHERE status = 'pending' 
            ORDER BY move_in_date DESC
        """)
        pending_requests = cur.fetchall()
        
        cur.close()
        print(f"Retrieved {len(houses_data)} houses from database")
        print(f"Retrieved {len(pending_requests)} pending requests")
        for house in houses_data:
            print(f"  House: {house}")
    except MySQLdb.ProgrammingError:
        houses_data = []
        pending_requests = []
        print("Database error retrieving data")
    
    return render_template("houses.html", houses=houses_data, pending_requests=pending_requests)


@app.route('/delete_house', methods=['POST'])
def delete_house():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    house_id = request.form.get('house_id')
    if not house_id:
        flash("House ID is required", "error")
        return redirect(url_for('houses'))
    
    try:
        cur = get_cursor()
        # Check if house exists
        cur.execute("SELECT house_number FROM houses WHERE id = %s", (house_id,))
        house = cur.fetchone()
        if not house:
            flash("House not found", "error")
            cur.close()
            return redirect(url_for('houses'))
        
        # Check if house is occupied by a tenant
        cur.execute("SELECT id FROM tenants WHERE house_number = %s AND status = 'approved'", (house[0],))
        tenant = cur.fetchone()
        if tenant:
            flash("Cannot delete house that is occupied by a tenant", "error")
            cur.close()
            return redirect(url_for('houses'))
        
        # Delete house
        cur.execute("DELETE FROM houses WHERE id = %s", (house_id,))
        mysql.connection.commit()
        cur.close()
        flash("House deleted successfully", "success")
        
    except Exception as e:
        print(f"Error deleting house: {e}")
        flash("Error deleting house", "error")
    
    return redirect(url_for('houses'))


@app.route('/approve_tenant_request', methods=['POST'])
def approve_tenant_request():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    tenant_id = request.form.get('tenant_id')
    if not tenant_id:
        flash("Tenant ID is required", "error")
        return redirect(url_for('houses'))
    
    try:
        cur = get_cursor()
        # Update tenant status to approved
        cur.execute("UPDATE tenants SET status = 'approved' WHERE id = %s", (tenant_id,))
        
        # Update house status to occupied
        cur.execute("UPDATE houses SET status = 'Occupied' WHERE house_number = (SELECT house_number FROM tenants WHERE id = %s)", (tenant_id,))
        
        mysql.connection.commit()
        cur.close()
        flash("Tenant request approved successfully", "success")
        
    except Exception as e:
        print(f"Error approving tenant request: {e}")
        flash("Error approving tenant request", "error")
    
    return redirect(url_for('houses'))


@app.route('/reject_tenant_request', methods=['POST'])
def reject_tenant_request():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    tenant_id = request.form.get('tenant_id')
    if not tenant_id:
        flash("Tenant ID is required", "error")
        return redirect(url_for('houses'))
    
    try:
        cur = get_cursor()
        # Get house number before deleting tenant
        cur.execute("SELECT house_number FROM tenants WHERE id = %s", (tenant_id,))
        tenant = cur.fetchone()
        
        # Delete tenant
        cur.execute("DELETE FROM tenants WHERE id = %s", (tenant_id,))
        
        # Update house status to vacant (if tenant existed)
        if tenant:
            cur.execute("UPDATE houses SET status = 'Vacant' WHERE house_number = %s", (tenant[0],))
        
        mysql.connection.commit()
        cur.close()
        flash("Tenant request rejected successfully", "success")
        
    except Exception as e:
        print(f"Error rejecting tenant request: {e}")
        flash("Error rejecting tenant request", "error")
    
    return redirect(url_for('houses'))


@app.route('/add_payment', methods=['GET', 'POST'])
def add_payment():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        # Test database connection first
        cur.execute("SELECT COUNT(*) FROM tenants")
        count = cur.fetchone()[0]
        
        query = "SELECT id, name, house_number FROM tenants ORDER BY name"
        cur.execute(query)
        tenants_list = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError as e:
        print(f"Database error: {e}")
        tenants_list = []
    except Exception as e:
        print(f"General error: {e}")
        tenants_list = []
    
    if request.method == 'POST':
        tenant_id = request.form.get('tenant_id')
        amount = request.form.get('amount')
        payment_method = request.form.get('payment_method')
        payment_date = request.form.get('payment_date')
        
        if not all([tenant_id, amount, payment_date]):
            return render_template("add_payment.html", tenants=tenants_list, error="All fields required")
        
        try:
            cur = get_cursor()
            cur.execute(
                "INSERT INTO payments(tenant_id, amount, payment_method, payment_date) VALUES(%s,%s,%s,%s)",
                (tenant_id, amount, payment_method, payment_date)
            )
            mysql.connection.commit()
            cur.close()
            flash("Payment recorded successfully.", "success")
            return redirect(url_for('payments'))
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
            flash("Error recording payment.", "error")
        finally:
            cur.close()
    return render_template("add_payment.html", tenants=tenants_list)


@app.route('/payments')
def payments():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT p.id, p.tenant_id, p.amount, p.payment_date, p.payment_method,
                   t.name as tenant_name
            FROM payments p
            JOIN tenants t ON t.id = p.tenant_id
            ORDER BY p.payment_date DESC, p.id DESC
        """)
        data = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        data = []
    return render_template("payments.html", payments=data)


@app.route('/maintenance', methods=['GET', 'POST'])
def maintenance():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        # Handle adding new maintenance request
        tenant = request.form.get('tenant')
        house_number = request.form.get('house_number')
        issue = request.form.get('issue')
        status = request.form.get('status', 'Open')
        
        if not all([house_number, issue]):
            try:
                cur = get_cursor()
                cur.execute("SELECT house_number FROM houses")
                houses = cur.fetchall()
                cur.close()
            except MySQLdb.ProgrammingError:
                houses = []
            return render_template("maintenance.html", houses=houses, maintenance_list=[], error="House number and issue are required")
        
        try:
            cur = get_cursor()
            cur.execute(
                "INSERT INTO maintenance(tenant, house_number, issue, status) VALUES(%s,%s,%s,%s)",
                (tenant, house_number, issue, status)
            )
            mysql.connection.commit()
            cur.close()
            flash("Maintenance request added successfully.", "success")
            return redirect(url_for('maintenance'))
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
            flash("Error adding maintenance request.", "error")
        finally:
            cur.close()
    
    # Handle GET request - display maintenance requests
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM maintenance ORDER BY id DESC")
        data = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        data = []
    
    # Also get houses for the form dropdown
    try:
        cur = get_cursor()
        cur.execute("SELECT house_number FROM houses")
        houses = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        houses = []
    
    return render_template("maintenance.html", maintenance_list=data, houses=houses)


@app.route('/edit_maintenance/<int:maintenance_id>', methods=['GET', 'POST'])
def edit_maintenance(maintenance_id):
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    try:
        cur = get_cursor()
        
        if request.method == 'POST':
            # Update maintenance request
            tenant = request.form.get('tenant')
            house_number = request.form.get('house_number')
            issue = request.form.get('issue')
            status = request.form.get('status')
            
            if not all([house_number, issue]):
                cur.execute("SELECT * FROM maintenance WHERE id = %s", (maintenance_id,))
                maintenance_data = cur.fetchone()
                cur.execute("SELECT house_number FROM houses")
                houses = cur.fetchall()
                cur.close()
                return render_template("maintenance_edit.html", m=maintenance_data, houses=houses, error="House number and issue are required")
            
            cur.execute(
                "UPDATE maintenance SET tenant=%s, house_number=%s, issue=%s, status=%s WHERE id=%s",
                (tenant, house_number, issue, status, maintenance_id)
            )
            mysql.connection.commit()
            cur.close()
            flash("Maintenance request updated successfully.", "success")
            return redirect(url_for('maintenance'))
        
        else:
            # GET request - show edit form
            cur.execute("SELECT * FROM maintenance WHERE id = %s", (maintenance_id,))
            maintenance_data = cur.fetchone()
            cur.execute("SELECT house_number FROM houses")
            houses = cur.fetchall()
            cur.close()
            
            if not maintenance_data:
                flash("Maintenance request not found.", "error")
                return redirect(url_for('maintenance'))
            
            return render_template("maintenance_edit.html", m=maintenance_data, houses=houses)
            
    except MySQLdb.ProgrammingError as e:
        print(f"Database error: {e}")
        flash("Error editing maintenance request.", "error")
        return redirect(url_for('maintenance'))


@app.route('/delete_maintenance/<int:maintenance_id>', methods=['POST'])
def delete_maintenance(maintenance_id):
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    try:
        cur = get_cursor()
        cur.execute("DELETE FROM maintenance WHERE id = %s", (maintenance_id,))
        mysql.connection.commit()
        cur.close()
        flash("Maintenance request deleted successfully.", "success")
    except MySQLdb.ProgrammingError:
        flash("Error deleting maintenance request.", "error")
    
    return redirect(url_for('maintenance'))


@app.route('/add_maintenance', methods=['GET', 'POST'])
def add_maintenance():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    if request.method == 'POST':
        tenant = request.form.get('tenant')
        house_number = request.form.get('house_number')
        issue = request.form.get('issue')
        
        if not all([tenant, house_number, issue]):
            return render_template("add_maintenance.html", error="All fields required")
        
        try:
            cur = get_cursor()
            cur.execute(
                "INSERT INTO maintenance(tenant, house_number, issue) VALUES(%s,%s,%s)",
                (tenant, house_number, issue)
            )
            mysql.connection.commit()
            cur.close()
            flash("Maintenance request added successfully.", "success")
            return redirect(url_for('maintenance'))
        except MySQLdb.ProgrammingError:
            mysql.connection.rollback()
            flash("Error adding maintenance request.", "error")
        finally:
            cur.close()
    return render_template("add_maintenance.html")


@app.route('/reports', methods=['GET', 'POST'])
def reports():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        report_type = request.form.get('report_type')
        report_data = None
        
        try:
            cur = get_cursor()
            
            if report_type == 'rent_collection':
                # Rent collection report
                cur.execute("""
                    SELECT p.id, t.name, p.amount, p.payment_date, p.payment_method
                    FROM payments p
                    JOIN tenants t ON t.id = p.tenant_id
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
                # Occupancy status report
                cur.execute("""
                    SELECT h.id, h.house_number, h.status, t.name
                    FROM houses h
                    LEFT JOIN tenants t ON t.house_number = h.house_number AND t.status = 'approved'
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
                # Outstanding rent report
                cur.execute("""
                    SELECT t.id, t.name, t.house_number, h.price, MAX(p.payment_date), 
                           h.price - COALESCE(SUM(p.amount), 0) as outstanding
                    FROM tenants t
                    JOIN houses h ON h.house_number = t.house_number
                    LEFT JOIN payments p ON p.tenant_id = t.id
                    WHERE t.status = 'approved'
                    GROUP BY t.id, t.name, t.house_number, h.price
                    HAVING outstanding > 0
                """)
                tenants = cur.fetchall()
                
                total_outstanding = sum(t[5] for t in tenants) if tenants else 0
                
                report_data = {
                    'tenants': tenants,
                    'total_outstanding': total_outstanding
                }
                
            elif report_type == 'tenant_list':
                # Tenant list report
                cur.execute("""
                    SELECT id, name, house_number, national_id, email, status, move_in_date
                    FROM tenants
                    ORDER BY name
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
                # Payment summary report
                cur.execute("""
                    SELECT payment_method, COUNT(*) as count, SUM(amount) as total
                    FROM payments
                    GROUP BY payment_method
                    ORDER BY total DESC
                """)
                methods = cur.fetchall()
                
                cur.execute("SELECT COUNT(*), SUM(amount) FROM payments")
                total_result = cur.fetchone()
                total_count = total_result[0] or 0
                total_amount = total_result[1] or 0
                average_amount = total_amount / total_count if total_count > 0 else 0
                
                method_breakdown = []
                for method in methods:
                    percentage = round((method[2] / total_amount * 100), 1) if total_amount > 0 else 0
                    method_breakdown.append((method[0], method[1], method[2], percentage))
                
                report_data = {
                    'total_count': total_count,
                    'total_amount': total_amount,
                    'average_amount': average_amount,
                    'method_breakdown': method_breakdown
                }
            
            cur.close()
            
        except Exception as e:
            print(f"Report generation error: {e}")
            report_data = None
        
        return render_template("reports.html", report_data=report_data, report_type=report_type)
    
    return render_template("reports.html")


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({
            "error": "The requested resource was not found. Please check the URL and try again.",
            "code": "RESOURCE_NOT_FOUND"
        }), 404
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_error(error):
    if request.path.startswith('/api/'):
        return jsonify({
            "error": "Our server encountered an unexpected error. Please try again in a few minutes.",
            "code": "INTERNAL_ERROR"
        }), 500
    return render_template("500.html"), 500


@app.errorhandler(400)
def bad_request(error):
    if request.path.startswith('/api/'):
        return jsonify({
            "error": "The request was invalid. Please check your input and try again.",
            "code": "BAD_REQUEST"
        }), 400
    return render_template("400.html"), 400


@app.errorhandler(403)
def forbidden(error):
    if request.path.startswith('/api/'):
        return jsonify({
            "error": "You don't have permission to access this resource.",
            "code": "FORBIDDEN"
        }), 403
    return render_template("403.html"), 403


@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "RHMS Backend"
    }), 200


# ===== API ROUTES =====

@app.route('/api/dashboard-stats')
def api_dashboard_stats():
    """Get dashboard statistics for frontend"""
    try:
        cur = get_cursor()
        cur.execute("SELECT COUNT(*) FROM tenants")
        total_tenants = cur.fetchone()[0] or 0
        
        cur.execute("SELECT COUNT(*) FROM houses")
        total_houses = cur.fetchone()[0] or 0
        
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


@app.route('/api/tenants', methods=['GET', 'POST'])
def api_tenants():
    """Handle GET and POST for tenants"""
    if request.method == 'GET':
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
    
    elif request.method == 'POST':
        """Register a new tenant"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data received"}), 400
            
            # Extract and validate fields
            name = str(data.get('name', '')).strip()
            national_id = str(data.get('national_id', '')).strip()
            phone = str(data.get('phone', '')).strip()
            email = str(data.get('email', '')).strip()
            house_number = str(data.get('house_number', '')).strip()
            move_in_date = str(data.get('move_in_date', '')).strip()
            
            # Validate required fields
            if not all([name, national_id, phone, email, house_number, move_in_date]):
                return jsonify({"error": "All fields are required"}), 400
            
            # Basic email validation
            if '@' not in email or '.' not in email:
                return jsonify({"error": "Invalid email address"}), 400
            
            cur = get_cursor()
            
            # Check if house exists and is vacant
            cur.execute("SELECT status FROM houses WHERE house_number = %s", (house_number,))
            house = cur.fetchone()
            if not house:
                cur.close()
                return jsonify({"error": "House not found"}), 400
            if house[0] != 'Vacant':
                cur.close()
                return jsonify({"error": "House is not available"}), 400
            
            # Check if email already exists
            cur.execute("SELECT id FROM tenants WHERE email = %s", (email,))
            if cur.fetchone():
                cur.close()
                return jsonify({"error": "Email already registered"}), 400
            
            # Insert tenant with pending status
            cur.execute("""
                INSERT INTO tenants(name, national_id, phone, email, house_number, move_in_date, status) 
                VALUES(%s, %s, %s, %s, %s, %s, %s)
            """, (name, national_id, phone, email, house_number, move_in_date, 'pending'))
            
            mysql.connection.commit()
            
            # Get created tenant
            tenant_id = cur.lastrowid
            cur.execute("""
                SELECT id, name, national_id, phone, email, house_number, move_in_date, status
                FROM tenants WHERE id = %s
            """, (tenant_id,))
            row = cur.fetchone()
            
            tenant = _row_to_tenant(row)
            cur.close()
            
            if not tenant:
                return jsonify({"error": "Failed to process tenant data"}), 500
            
            return jsonify({
                "success": True, 
                "message": "Tenant registration submitted successfully! Your application is pending approval.",
                "tenant": tenant
            }), 201
            
        except Exception as e:
            print(f"Registration error: {e}")
            return jsonify({"error": f"Registration failed: {str(e)}"}), 500


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


@app.route('/api/test-email', methods=['POST'])
def test_email():
    """Test email sending functionality"""
    try:
        data = request.get_json()
        test_email = data.get('email', 'mairuramoses57@gmail.com')
        
        success = send_approval_email(test_email, "Test Tenant", "A101")
        
        if success:
            return jsonify({
                "success": True, 
                "message": f"Test email sent to {test_email}"
            })
        else:
            return jsonify({
                "success": False, 
                "message": "Failed to send test email"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e)
        }), 500


@app.route('/api/approve-tenant/<int:tenant_id>', methods=['POST'])
def api_approve_tenant(tenant_id):
    """Approve a tenant registration"""
    try:
        cur = get_cursor()
        
        # Get tenant details before updating
        cur.execute("SELECT name, email, house_number FROM tenants WHERE id = %s", (tenant_id,))
        tenant = cur.fetchone()
        
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        tenant_name, tenant_email, house_number = tenant
        
        # Update tenant status to approved
        cur.execute("UPDATE tenants SET status = 'approved' WHERE id = %s", (tenant_id,))
        mysql.connection.commit()
        
        # Update house status to occupied
        cur.execute("UPDATE houses SET status = 'Occupied' WHERE house_number = %s", (house_number,))
        mysql.connection.commit()
        
        # Send approval email
        email_sent = send_approval_email(tenant_email, tenant_name, house_number)
        
        # Create success message
        success_message = f"🎉 Congratulations {tenant_name}! Your selected house {house_number} has been approved successfully. You can now access your dashboard. Thank you for your patience!"
        
        cur.close()
        return jsonify({
            "success": True, 
            "message": "Tenant approved successfully",
            "tenant_message": success_message,
            "email_sent": email_sent,
            "tenant": {
                "name": tenant_name,
                "email": tenant_email,
                "house_number": house_number
            }
        })
    except Exception as e:
        return jsonify({"error": f"Could not approve tenant: {str(e)}"}), 500


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
        
        # Get created payment
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

@app.route('/api/houses', methods=['GET', 'POST'])
def api_houses():
    """Handle GET and POST for houses"""
    if request.method == 'GET':
        # Get all houses
        try:
            cur = get_cursor()
            cur.execute("SELECT * FROM houses")
            houses = cur.fetchall()
            cur.close()
            
            # Convert to list of dictionaries
            house_list = []
            for house in houses:
                house_list.append(_row_to_house(house))
            
            return jsonify(house_list)
        except Exception as e:
            return jsonify({"error": "Could not fetch houses"}), 500
    
    elif request.method == 'POST':
        # Add a new house
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data received"}), 400
            
            house_number = str(data.get('house_number', '')).strip()
            status = str(data.get('status', 'Vacant')).strip()
            
            # Handle price conversion
            price = data.get('price', 10000.00)
            try:
                price = float(price)
            except (ValueError, TypeError):
                price = 10000.00
            
            house_type = str(data.get('house_type', 'Single Room')).strip()
            
            if not house_number:
                return jsonify({"error": "House number is required"}), 400
            
            cur = get_cursor()
            
            # Insert new house with price and type
            cur.execute(
                "INSERT INTO houses (house_number, status, price, house_type) VALUES (%s, %s, %s, %s)",
                (house_number, status, price, house_type)
            )
            mysql.connection.commit()
            
            # Get created house
            house_id = cur.lastrowid
            cur.execute("SELECT * FROM houses WHERE id = %s", (house_id,))
            row = cur.fetchone()
            
            house = _row_to_house(row)
            cur.close()
            
            if not house:
                return jsonify({"error": "Failed to process house data"}), 500
            
            return jsonify(house)
            
        except Exception as e:
            print(f"House creation error: {e}")
            return jsonify({"error": f"Failed to add house: {str(e)}"}), 500


@app.route('/api/houses/<int:house_id>', methods=['PUT'])
def api_update_house(house_id):
    """Update house information including price"""
    try:
        data = request.get_json()
        price = data.get('price')
        status = data.get('status')
        
        if price is None and status is None:
            return jsonify({"error": "At least one field (price or status) must be provided"}), 400
        
        cur = get_cursor()
        
        # Check if house exists
        cur.execute("SELECT house_number, status FROM houses WHERE id = %s", (house_id,))
        house = cur.fetchone()
        if not house:
            cur.close()
            return jsonify({"error": "House not found"}), 404
        
        # Build update query
        update_fields = []
        update_values = []
        
        if price is not None:
            update_fields.append("price = %s")
            update_values.append(price)
        
        if status is not None:
            update_fields.append("status = %s")
            update_values.append(status)
        
        update_values.append(house_id)
        
        query = f"UPDATE houses SET {', '.join(update_fields)} WHERE id = %s"
        cur.execute(query, update_values)
        mysql.connection.commit()
        
        # Get updated house
        cur.execute("SELECT id, house_number, status, price FROM houses WHERE id = %s", (house_id,))
        row = cur.fetchone()
        
        house_data = {
            "id": row[0],
            "house_number": row[1],
            "status": row[2],
            "price": float(row[3]) if row[3] is not None else 0.0
        }
        
        cur.close()
        return jsonify(house_data)
        
    except Exception as e:
        return jsonify({"error": "Could not update house"}), 500


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
        
        # Delete house
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
        cur.close()
        
        return jsonify({"success": True, "message": "Maintenance request submitted successfully"})
        
    except Exception as e:
        return jsonify({"error": "Could not submit maintenance request"}), 500


@app.route('/api/approved-tenants')
def api_approved_tenants():
    """Get all approved tenants for dropdown"""
    try:
        cur = get_cursor()
        # Test database connection first
        cur.execute("SELECT COUNT(*) FROM tenants")
        count = cur.fetchone()[0]
        
        query = "SELECT id, name, house_number FROM tenants ORDER BY name"
        cur.execute(query)
        tenants_list = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError as e:
        print(f"Database error: {e}")
        tenants_list = []
    except Exception as e:
        print(f"General error: {e}")
        tenants_list = []
    
    return jsonify(tenants_list)


@app.route('/api/tenant-login', methods=['POST'])
def api_tenant_login():
    """Handle tenant login"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400
            
        email = str(data.get('email', '')).strip()
        password = str(data.get('password', '')).strip()
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Basic email validation
        if '@' not in email or '.' not in email:
            return jsonify({"error": "Invalid email address"}), 400
        
        cur = get_cursor()
        
        # Find tenant by email (any status - allow login before approval)
        query = """
        SELECT id, name, national_id, phone, email, house_number, move_in_date, status
        FROM tenants 
        WHERE email = %s
        """
        cur.execute(query, (email,))
        tenant = cur.fetchone()
        cur.close()
        
        if not tenant:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Convert tenant data
        tenant_data = _row_to_tenant(tenant)
        if not tenant_data:
            return jsonify({"error": "Error processing tenant data"}), 500
        
        # For now, use national_id as password (as mentioned in frontend)
        if password != tenant_data['national_id']:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate a simple token (in production, use JWT)
        import random
        token = f"tenant_{tenant_data['id']}_{random.randint(1000, 9999)}"
        
        return jsonify({
            "success": True,
            "token": token,
            "tenant": tenant_data
        })
        
    except Exception as e:
        print(f"Tenant login error: {e}")
        return jsonify({"error": "Login failed. Please try again."}), 500


@app.route('/api/tenant-payments/<int:tenant_id>', methods=['GET'])
def api_tenant_payments(tenant_id):
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT amount, payment_date, payment_method
            FROM payments 
            WHERE tenant_id = %s 
            ORDER BY payment_date DESC 
            LIMIT 10
        """, (tenant_id,))
        payments = cur.fetchall()
        cur.close()
        
        payment_list = [
            {
                "amount": float(p[0]), 
                "date": p[1].strftime('%Y-%m-%d'), 
                "method": p[2]
            }
            for p in payments
        ]
        
        return jsonify(payment_list)
        
    except Exception as e:
        print(f"Error fetching tenant payments: {e}")
        return jsonify({"error": "Failed to fetch payments"}), 500


@app.route('/api/tenant-dashboard', methods=['GET'])
def api_tenant_dashboard():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization required"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            tenant_id = int(token.split('_')[1])
        except:
            return jsonify({"error": "Invalid token"}), 401
        
        cur = get_cursor()
        
        cur.execute("""
            SELECT id, name, national_id, phone, email, house_number, move_in_date, status
            FROM tenants WHERE id = %s
        """, (tenant_id,))
        tenant = cur.fetchone()
        
        if not tenant:
            cur.close()
            return jsonify({"error": "Tenant not found"}), 404
        
        tenant_data = _row_to_tenant(tenant)
        
        dashboard_data = {
            "tenant": tenant_data,
            "is_approved": tenant_data['status'] == 'approved',
            "message": "Your application is pending approval" if tenant_data['status'] == 'pending' else "Welcome to your dashboard"
        }
        
        if tenant_data['status'] == 'approved':
            try:
                cur.execute("""
                    SELECT house_number, house_type, price
                    FROM houses 
                    WHERE house_number = %s
                """, (tenant_data['house_number'],))
                house_info = cur.fetchone()
                
                cur.execute("""
                    SELECT amount, payment_date, payment_method
                    FROM payments 
                    WHERE tenant_id = %s 
                    ORDER BY payment_date DESC 
                    LIMIT 5
                """, (tenant_id,))
                payments = cur.fetchall()
                
                total_paid = sum(p[0] for p in payments) if payments else 0
                house_price = house_info[2] if house_info else 0
                balance = house_price - total_paid
                payment_status = "Paid" if balance <= 0 else "Due"
                
                cur.execute("""
                    SELECT issue, status
                    FROM maintenance 
                    WHERE tenant = %s 
                    ORDER BY id DESC 
                    LIMIT 5
                """, (tenant_data['name'],))
                maintenance = cur.fetchall()
                
                dashboard_data.update({
                    "balanceInfo": {
                        "house_number": house_info[0] if house_info else tenant_data['house_number'],
                        "house_type": house_info[1] if house_info else "Not assigned",
                        "house_price": house_price,
                        "total_paid": total_paid,
                        "balance": balance,
                        "payment_status": payment_status
                    },
                    "payments": [
                        {"amount": float(p[0]), "date": p[1].strftime('%Y-%m-%d'), "method": p[2]}
                        for p in payments
                    ],
                    "maintenance_requests": [
                        {"issue": m[0], "status": m[1], "date": "Submitted recently"}
                        for m in maintenance
                    ],
                    "can_make_payments": True,
                    "can_request_maintenance": True
                })
                
            except Exception as e:
                print(f"Error getting tenant data: {e}")
                dashboard_data.update({
                    "payments": [],
                    "maintenance_requests": []
                })
        else:
            dashboard_data.update({
                "payments": [],
                "maintenance_requests": [],
                "can_make_payments": False,
                "can_request_maintenance": False,
                "restrictions": [
                    "Cannot make payments until approved",
                    "Cannot request maintenance until approved",
                    "Limited access until approval"
                ]
            })
        
        cur.close()
        return jsonify(dashboard_data)
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({"error": "Failed to load dashboard data"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
