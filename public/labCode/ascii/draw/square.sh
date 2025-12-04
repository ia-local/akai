#!/bin/bash

# =========================================================
# square_ratio_corrected.sh - Dessine un carré ASCII VISUELLEMENT parfait
# =========================================================

# --- Variables de Caractères pour les Bordures ---
TOP_LEFT="╔"
TOP_RIGHT="╗"
BOTTOM_LEFT="╚"
BOTTOM_RIGHT="╝"
HORIZONTAL="═"
VERTICAL="║"
INTERNAL_CHAR=" " # Caractère de remplissage interne

# --- Ratio d'Aspect des Caractères (Hauteur par rapport à la Largeur) ---
# Ceci est le paramètre clé à ajuster !
# La plupart des polices de terminal ont un ratio de 2 (hauteur est 2x la largeur).
# Si votre terminal a un ratio différent, ajustez cette valeur.
CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH=2

# --- Fonction de Dessin du Carré ---
# Prend la 'taille_visuelle' du côté en largeur. La hauteur sera ajustée.
draw_square() {
    local visual_width=$1

    # Validation des entrées
    if ! [[ "$visual_width" =~ ^[0-9]+$ ]]; then
        echo "Erreur: La taille du côté doit être un nombre entier."
        echo "Utilisation: ./square_ratio_corrected.sh <largeur_visuelle>"
        return 1
    fi

    if (( visual_width < 2 )); then
        echo "Erreur: La largeur visuelle doit être au moins 2 pour un carré."
        echo "Utilisation: ./square_ratio_corrected.sh <largeur_visuelle>"
        return 1
    fi

    # Calcul de la hauteur réelle en caractères pour compenser le ratio
    # La largeur réelle des caractères est 'visual_width'
    # La hauteur réelle nécessaire est 'visual_width' / CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH
    local actual_height=$(( visual_width / CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH ))

    # Assurez-vous que la hauteur minimale est de 2 (pour les bordures)
    if (( actual_height < 2 )); then
        actual_height=2
    fi

    # --- Dessin ---

    # Ligne du haut
    echo -n "${TOP_LEFT}"
    printf "${HORIZONTAL}%.0s" $(seq 1 $((visual_width - 2)))
    echo "${TOP_RIGHT}"

    # Lignes du milieu
    for ((i = 0; i < actual_height - 2; i++)); do
        echo -n "${VERTICAL}"
        printf "${INTERNAL_CHAR}%.0s" $(seq 1 $((visual_width - 2)))
        echo "${VERTICAL}"
    done

    # Ligne du bas
    echo -n "${BOTTOM_LEFT}"
    printf "${HORIZONTAL}%.0s" $(seq 1 $((visual_width - 2)))
    echo "${BOTTOM_RIGHT}"
}

# --- Exécution du Script ---
# Vérifier si l'argument nécessaire est fourni
if [ "$#" -ne 1 ]; then
    echo "Utilisation: ./square_ratio_corrected.sh <largeur_visuelle>"
    echo "Exemple: ./square_ratio_corrected.sh 10"
    exit 1
fi

# Appeler la fonction de dessin avec l'argument passé au script
draw_square "$1"