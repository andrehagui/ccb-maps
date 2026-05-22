from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dados")
def dados():
    with open("dados.json", "r", encoding="utf-8") as arquivo:
        igrejas = json.load(arquivo)
    return jsonify(igrejas)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)