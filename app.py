from flask import Flask, render_template, jsonify
from pathlib import Path
import json

# =========================================
# CONFIGURAÇÃO DA APLICAÇÃO
# =========================================

app = Flask(__name__)

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent

# Caminho do arquivo JSON
DADOS_PATH = BASE_DIR / "dados.json"


# =========================================
# FUNÇÃO PARA CARREGAR DADOS
# =========================================

def carregar_igrejas():

    try:

        with open(DADOS_PATH, "r", encoding="utf-8") as arquivo:

            igrejas = json.load(arquivo)

        return igrejas

    except FileNotFoundError:

        print("ERRO: Arquivo dados.json não encontrado.")
        return []

    except json.JSONDecodeError:

        print("ERRO: JSON inválido.")
        return []

    except Exception as error:

        print(f"ERRO INESPERADO: {error}")
        return []


# =========================================
# ROTAS
# =========================================

@app.route("/")
def home():

    return render_template("index.html")


@app.route("/dados")
def dados():

    igrejas = carregar_igrejas()

    return jsonify(igrejas)


# =========================================
# HANDLERS DE ERRO
# =========================================

@app.errorhandler(404)
def pagina_nao_encontrada(error):

    return jsonify({
        "erro": "Página não encontrada."
    }), 404


@app.errorhandler(500)
def erro_interno(error):

    return jsonify({
        "erro": "Erro interno do servidor."
    }), 500


# =========================================
# EXECUÇÃO DA APLICAÇÃO
# =========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )