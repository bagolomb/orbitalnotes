
# Installation Guide for `orbitalnotes`

This guide walks you through setting up the `orbitalnotes` project — a fullstack app using a **Python backend** and  **Svelte frontend** , fully isolated inside a **Conda environment** for reliability and reproducibility.

---

## 📦 Prerequisites

* [Anaconda or Miniconda](https://docs.conda.io/en/latest/miniconda.html)
* Git Bash / PowerShell / Terminal
* Python 3.11+
* `nodeenv` (Node.js installed inside the Conda env — no global conflicts)

---

## 🛠️ Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/orbitalnotes.git
cd orbitalnotes
```

---

### 2. Set Up the Conda Environment

> If the environment doesn’t already exist:

```bash
conda env create -f environment.yml
```

> If the environment already exists:

```bash
conda env update -f environment.yml --prune
```

Then activate it:

```bash
conda activate orbitalnotes
```

---

### 3. Install Node.js Inside Conda (if not already installed via `environment.yml`)

```bash
pip install nodeenv
nodeenv -p --node=18.19.0
```

This safely installs Node.js inside the `orbitalnotes` Conda environment.

---

### 4. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Start the Python backend (FastAPI):

```bash
uvicorn app.main:app --reload
```

---

### 5. Set Up Frontend (Svelte)

```bash
cd ../frontend
npm install
npm run dev
```

Your Svelte frontend will be running at `http://localhost:5173`.

---

### 6. Project Structure Overview

```
orbitalnotes/
├── backend/
│   ├── app/
│   │   └── main.py        # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json       # Svelte + Express + TypeScript
├── environment.yml        # Conda environment config
└── README.md
```

---

### ✅ Best Practices

* Always activate the environment: `conda activate orbitalnotes`
* Use `pip freeze > requirements.txt` and `npm install <pkg>` carefully
* Regenerate `environment.yml` with:
  ```bash
  conda env export --no-builds > environment.yml
  ```
