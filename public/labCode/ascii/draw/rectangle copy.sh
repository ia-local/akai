#!/bin/bash

# ===============================================
# rectangle.sh - Script pour dessiner un rectangle en Art ASCII
# ===============================================

# --- Variables de Caractères pour les Bordures ---
# Vous pouvez les modifier pour changer le style du rectangle.
TOP_LEFT="╔"
TOP_RIGHT="╗"
BOTTOM_LEFT="╚"
BOTTOM_RIGHT="╝"
HORIZONTAL="═"
VERTICAL="║"

# --- Fonction de Dessin du Rectangle ---
# Cette fonction prend la largeur et la hauteur en paramètres
# pour dessiner le rectangle.
draw_rectangle() {
    local width=$1
    local height=$2

    # Validation des entrées
    if ! [[ "$width" =~ ^[0-9]+$ ]] || ! [[ "$height" =~ ^[0-9]+$ ]]; then
        echo "Erreur: La largeur et la hauteur doivent être des nombres entiers."
        echo "Utilisation: ./rectangle.sh <largeur> <hauteur>"
        return 1
    fi

    if (( width < 2 || height < 2 )); then
        echo "Erreur: La largeur et la hauteur doivent être au moins 2 pour un rectangle."
        echo "Utilisation: ./rectangle.sh <largeur> <hauteur>"
        return 1
    fi

    # Ligne du haut
    echo -n "${TOP_LEFT}"
    printf "${HORIZONTAL}%.0s" $(seq 1 $((width - 2)))
    echo "${TOP_RIGHT}"

    # Lignes du milieu
    for ((i = 0; i < height - 2; i++)); do
        echo -n "${VERTICAL}"
        printf " %.0s" $(seq 1 $((width - 2))) # Espaces à l'intérieur
        echo "${VERTICAL}"
    done

    # Ligne du bas
    echo -n "${BOTTOM_LEFT}"
    printf "${HORIZONTAL}%.0s" $(seq 1 $((width - 2)))
    echo "${BOTTOM_RIGHT}"
}

# --- Exécution du Script ---
# Vérifier si les arguments nécessaires sont fournis
if [ "$#" -ne 2 ]; then
    echo "Utilisation: ./rectangle.sh <largeur> <hauteur>"
    echo "Exemple: ./rectangle.sh 20 5"
    exit 1
fi

# Appeler la fonction de dessin avec les arguments passés au script
draw_rectangle "$1" "$2"