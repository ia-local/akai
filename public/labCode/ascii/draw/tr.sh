#!/bin/bash

# =========================================================
# triangle.sh - Dessine un triangle rectangle isocèle en Art ASCII
# =========================================================

# --- Variables de Caractères ---
# Caractères pour les côtés du triangle.
HORIZONTAL_CHAR="═"
VERTICAL_CHAR="║"
DIAGONAL_CHAR="\\" # Caractère pour la diagonale (ou '/')
SPACE_CHAR=" "    # Caractère de remplissage interne

# --- Ratio d'Aspect des Caractères (Hauteur par rapport à la Largeur) ---
# La plupart des polices de terminal ont un ratio de 2 (hauteur est 2x la largeur).
# Ajustez cette valeur pour que le triangle paraisse équilibré sur votre terminal.
CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH=2

# --- Fonction de Dessin du Triangle Rectangle Isocèle (angle droit en bas à gauche) ---
# Prend la 'taille_base_visuelle' (longueur de la base horizontale) en paramètre.
# La hauteur sera calculée pour que la diagonale soit à 45 degrés visuellement.
draw_right_triangle() {
    local visual_base_width=$1

    # Validation des entrées
    if ! [[ "$visual_base_width" =~ ^[0-9]+$ ]]; then
        echo "Erreur: La taille de la base doit être un nombre entier."
        echo "Utilisation: ./triangle.sh <largeur_base_visuelle>"
        return 1
    fi

    if (( visual_base_width < 3 )); then # Minimum 3 pour avoir des côtés distincts
        echo "Erreur: La largeur de la base visuelle doit être au moins 3 pour un triangle lisible."
        echo "Utilisation: ./triangle.sh <largeur_base_visuelle>"
        return 1
    fi

    # Calcul de la hauteur réelle en caractères pour obtenir une diagonale à 45 degrés visuellement.
    # On ajoute +1 pour s'assurer qu'il y a assez de lignes pour la diagonale et la base.
    local actual_height=$(( (visual_base_width / CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH) + 1 ))

    # Assurez-vous que la hauteur minimale est de 2 pour avoir la base et au moins une ligne au-dessus
    if (( actual_height < 2 )); then
        actual_height=2
    fi

    # --- Dessin Ligne par Ligne ---
    for ((y = 0; y < actual_height; y++)); do
        echo -n "${VERTICAL_CHAR}" # Bord gauche du triangle

        # Calculer la position approximative de la diagonale pour cette ligne
        # Plus y augmente, plus le caractère diagonal se déplace vers la droite.
        # Nous voulons qu'il se déplace d'environ 1 caractère pour chaque pas de 1/ratio en hauteur.
        # (visual_base_width - 2) est la largeur interne, (actual_height - 1 - y) est la hauteur relative du haut
        local x_diag=$(( (visual_base_width - 2) * (actual_height - 1 - y) / (actual_height - 1) ))

        for ((x = 0; x < visual_base_width - 2; x++)); do
            if (( y == actual_height - 1 )); then # Dernière ligne : la base horizontale
                echo -n "${HORIZONTAL_CHAR}"
            elif (( x >= x_diag )); then # Caractère sur ou après la diagonale
                echo -n "${DIAGONAL_CHAR}"
                # Pour éviter de "doubler" la diagonale, on met un espace après le premier caractère diagonal
                # mais cela peut laisser des "trous". On va juste le laisser simple ici.
                DIAGONAL_CHAR="${SPACE_CHAR}" # Pour remplir l'intérieur une fois la diagonale passée
            else
                echo -n "${SPACE_CHAR}"
            fi
        done
        # Réinitialiser le caractère diagonal pour la prochaine ligne si besoin
        DIAGONAL_CHAR="\\"

        echo "${VERTICAL_CHAR}" # Bord droit du triangle
    done

    # Dernière ligne : la base (re-dessinée séparément pour simplifier)
    # C'est la ligne du bas qui ferme le triangle.
    echo -n "${VERTICAL_CHAR}"
    printf "${HORIZONTAL_CHAR}%.0s" $(seq 1 $((visual_base_width - 2)))
    echo "${VERTICAL_CHAR}"
}


# --- Exécution du Script ---
if [ "$#" -ne 1 ]; then
    echo "Utilisation: ./triangle.sh <largeur_base_visuelle>"
    echo "Exemple: ./triangle.sh 20"
    exit 1
fi

draw_right_triangle "$1"