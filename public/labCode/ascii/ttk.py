import tkinter as tk

# Fonction pour exécuter une commande
def execute_command():
    # Récupérer la commande à partir de l'entrée utilisateur
    command = command_entry.get()
    
    # Exécutez la commande ici (vous devez implémenter cette partie)
    # Par exemple : os.system(command)
    
    # Effacez le champ de texte après l'exécution
    command_entry.delete(0, tk.END)

# Créer une fenêtre
window = tk.Tk()
window.title("Interface de gestion des commandes Makefile")

# Créer un cadre pour l'interface ASCII art
ascii_frame = tk.Frame(window)
ascii_frame.pack()

# Ajouter l'ASCII art (à personnaliser selon vos besoins)
ascii_text = [
    "╔----──────═╦═──────────╗",
    "│                       │",
    "│                       │",
    "║                       ║",
    "╠           ╬           ╣",
    "║                       ║",
    "│                       │",
    "│                       │",
    "╚-─────────═╩═──────────╝"
]

for i, line in enumerate(ascii_text):
    label = tk.Label(ascii_frame, text=line, font=("Courier New", 10))
    label.grid(row=i, column=0, padx=5, pady=5)

# Créer un champ de texte pour entrer la commande Makefile
command_label = tk.Label(window, text="Commande Makefile:")
command_label.pack()

command_entry = tk.Entry(window, width=40)
command_entry.pack()

# Créer un bouton pour exécuter la commande
execute_button = tk.Button(window, text="Exécuter", command=execute_command)
execute_button.pack()

# Exécutez l'interface graphique
window.mainloop()