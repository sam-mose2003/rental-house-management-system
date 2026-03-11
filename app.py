from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "Rental House Management System is running successfully"

if __name__ == "__main__":
    app.run(debug=True)
