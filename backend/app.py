import MySQLdb
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_mysqldb import MySQL
import hashlib
import time
import os
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'rhms_secret_key'

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'

mysql = MySQL(app)

# Allow all origins for development
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5176", "http://127.0.0.1:5176", "*"], supports_credentials=True)

def get_cursor():
    return mysql.connection.cursor()


def _row_to_house(row):
    """Convert a house row to a dictionary"""
    if len(row) >= 5:
        return {
            "id": row[0],
            "house_number": row[1],
            "status": row[2],
            "price": float(row[3]) if row[3] is not None else 0.0,
            "house_type": row[4] if row[4] is not None else "Single Room"
        }
    else:
        # Fallback for old data structure
        return {
            "id": row[0],
            "house_number": row[1],
            "status": row[2],
            "price": float(row[3]) if len(row) > 3 and row[3] is not None else 0.0,
            "house_type": "Single Room"
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


@app.route('/houses')
def houses():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM houses")
        data = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        data = []
    return render_template("houses.html", houses=data)


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


@app.route('/maintenance')
def maintenance():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM maintenance ORDER BY id DESC")
        data = cur.fetchall()
        cur.close()
    except MySQLdb.ProgrammingError:
        data = []
    return render_template("maintenance.html", maintenance=data)


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


@app.route('/reports')
def reports():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template("reports.html")


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


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

@app.route('/api/houses', methods=['POST'])
def api_add_house():
    """Add a new house"""
    try:
        data = request.get_json()
        house_number = data.get('house_number', '').strip()
        status = data.get('status', 'Vacant')
        price = data.get('price', 10000.00)  # Default price if not provided
        house_type = data.get('house_type', 'Single Room')  # Default type if not provided
        
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
        
        house = {
            "id": row[0],
            "house_number": row[1],
            "status": row[2],
            "price": float(row[3]) if len(row) > 3 else 10000.00,
            "house_type": row[4] if len(row) > 4 else "Single Room"
        }
        
        cur.close()
        return jsonify(house), 201
    except Exception as e:
        return jsonify({"error": "Could not add house"}), 500


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


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
