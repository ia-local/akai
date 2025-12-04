#!/bin/bash

# =========================================================
# triangles.sh - Dessine différents types de triangles en Art ASCII
# =========================================================

# --- Variables de Caractères ---
# Ajustez ces caractères pour personnaliser le style.
HORIZONTAL_CHAR="═"
VERTICAL_CHAR="║"
DIAGONAL_TOP_LEFT_TO_BOTTOM_RIGHT="\\" # Ex: \
DIAGONAL_TOP_RIGHT_TO_BOTTOM_LEFT="/"   # Ex: /
SPACE_CHAR=" " # Caractère de remplissage interne

# --- Ratio d'Aspect des Caractères (Hauteur par rapport à la Largeur) ---
# Ceci est le paramètre clé à ajuster pour que les triangles paraissent équilibrés.
# La plupart des polices de terminal ont un ratio de 2 (hauteur est 2x la largeur).
CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH=2

# --- Fonction Utilitaire : Répéter un caractère ---
# Permet de répéter un caractère 'n' fois.
repeat_char() {
    local char=$1
    local count=$2
    printf "%${count}s" | tr " " "$char"
}

# --- 1. Triangle Rectangle (Angle droit en bas à gauche) ---
# Prend la 'largeur_base_visuelle' en paramètre.
# La hauteur est ajustée par le ratio.
draw_right_triangle() {
    local visual_base_width=$1

    if (( visual_base_width < 3 )); then
        echo "Erreur: Largeur de base minimale pour le triangle rectangle est 3."
        return 1
    fi

    # Calcul de la hauteur réelle pour que la diagonale soit à 45 degrés visuellement.
    local actual_height=$(( (visual_base_width / CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH) + 1 ))
    if (( actual_height < 2 )); then actual_height=2; fi # Minimum 2 lignes pour base + côté

    echo "${VERTICAL_CHAR}$(repeat_char ${HORIZONTAL_CHAR} $((visual_base_width - 2)))${VERTICAL_CHAR}" # Ligne du haut (base)
    
    for ((y = 0; y < actual_height - 1; y++)); do # Boucle pour les lignes au-dessus de la base
        echo -n "${VERTICAL_CHAR}" # Bord gauche

        # Calcul de la position de la diagonale pour cette ligne
        # Plus y est grand (on descend), plus la diagonale se déplace vers la gauche
        local diag_x=$(( (visual_base_width - 2) * (actual_height - 1 - y) / (actual_height - 1) ))
        
        for ((x = 0; x < visual_base_width - 2; x++)); do
            if (( x == diag_x )); then
                echo -n "${DIAGONAL_TOP_LEFT_TO_BOTTOM_RIGHT}"
            elif (( x < diag_x )); then
                echo -n "${SPACE_CHAR}" # Espace avant la diagonale
            else # Caractères après la diagonale (peut être rempli ou vide)
                echo -n "${SPACE_CHAR}"
            fi
        done
        echo "${VERTICAL_CHAR}" # Bord droit
    done
    echo "${VERTICAL_CHAR}$(repeat_char ${HORIZONTAL_CHAR} $((visual_base_width - 2)))${VERTICAL_CHAR}" # Ligne du bas (base)
}

# --- 2. Triangle Isocèle (Sommet en haut, base en bas) ---
# Prend la 'largeur_base_visuelle' en paramètre.
# La hauteur est ajustée par le ratio.
draw_isosceles_triangle() {
    local visual_base_width=$1

    if (( visual_base_width < 3 || (visual_base_width % 2) != 1 )); then
        echo "Erreur: Largeur de base minimale pour le triangle isocèle est 3 et doit être impaire."
        return 1
    fi

    # Calcul de la hauteur réelle pour que le triangle paraisse équilibré.
    local actual_height=$(( visual_base_width / (2 * CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH) + 1 ))
    if (( actual_height < 2 )); then actual_height=2; fi

    local half_width=$(( visual_base_width / 2 ))

    for ((y = 0; y < actual_height; y++)); do
        local chars_on_line=$(( (visual_base_width * y) / (actual_height - 1) ))
        local spaces_left=$(( (visual_base_width - chars_on_line) / 2 ))
        
        # S'assurer que le nombre de caractères est impair si la base est impaire pour le sommet
        if (( chars_on_line % 2 == 0 )) && (( y < actual_height - 1 )); then
            chars_on_line=$(( chars_on_line + 1 ))
            spaces_left=$(( (visual_base_width - chars_on_line) / 2 ))
        fi

        # Ligne du haut (pointe)
        if (( y == 0 )); then
            echo "$(repeat_char ${SPACE_CHAR} ${half_width})${DIAGONAL_TOP_RIGHT_TO_BOTTOM_LEFT}"
            continue
        fi

        # Lignes du milieu
        echo -n "$(repeat_char ${SPACE_CHAR} ${spaces_left})" # Espaces à gauche
        echo -n "${DIAGONAL_TOP_RIGHT_TO_BOTTOM_LEFT}" # Bord gauche
        echo -n "$(repeat_char ${SPACE_CHAR} $((chars_on_line - 2)))" # Espaces internes
        echo "${DIAGONAL_TOP_LEFT_TO_BOTTOM_RIGHT}" # Bord droit
    done

    # Ligne du bas (base)
    echo "$(repeat_char ${HORIZONTAL_CHAR} ${visual_base_width})"
}

# --- 3. Triangle Équilatéral (Simulé en ASCII) ---
# Pour un triangle équilatéral visuel, on se base sur la largeur de la base
# et on ajuste la hauteur pour que les côtés paraissent égaux.
# Un vrai équilatéral ASCII est très difficile sans une police carrée.
draw_equilateral_triangle() {
    local visual_base_width=$1

    if (( visual_base_width < 3 || (visual_base_width % 2) != 1 )); then
        echo "Erreur: Largeur de base minimale pour le triangle équilatéral est 3 et doit être impaire."
        return 1
    fi

    # Hauteur approximative pour un triangle équilatéral visuel
    # √(3)/2 * côté. En ASCII, on compense avec le ratio des caractères.
    # On prend la largeur visuelle comme "côté" pour le calcul.
    local actual_height=$(( (visual_base_width * 866 / 1000) / CHAR_ASPECT_RATIO_HEIGHT_TO_WIDTH )) # 0.866 est approx sqrt(3)/2
    if (( actual_height < 2 )); then actual_height=2; fi

    local half_base=$(( visual_base_width / 2 ))

    for ((y = 0; y < actual_height; y++)); do
        local line_width=$(( (visual_base_width * (y + 1)) / actual_height ))
        if (( line_width % 2 == 0 )) && (( y < actual_height - 1 )); then line_width=$(( line_width + 1 )); fi # Garder l'impair
        
        local leading_spaces=$(( (visual_base_width - line_width) / 2 ))
        
        echo -n "$(repeat_char ${SPACE_CHAR} ${leading_spaces})"

        if (( y == actual_height - 1 )); then # Base
            echo "$(repeat_char ${HORIZONTAL_CHAR} ${visual_base_width})"
        else # Côtés diagonaux
            echo -n "${DIAGONAL_TOP_RIGHT_TO_BOTTOM_LEFT}" # Côté gauche
            echo -n "$(repeat_char ${SPACE_CHAR} $((line_width - 2)))"
            echo "${DIAGONAL_TOP_LEFT_TO_BOTTOM_RIGHT}" # Côté droit
        fi
    done
}


# --- Exécution du Script ---
case "$1" in
    "rectangle")
        echo "--- Triangle Rectangle (Angle bas-gauche) - Largeur $2 ---"
        draw_right_triangle "$2"
        ;;
    "isocele")
        echo "--- Triangle Isocèle (Sommet haut) - Largeur $2 ---"
        draw_isosceles_triangle "$2"
        ;;
    "equilateral")
        echo "--- Triangle Équilatéral (Simulé) - Largeur $2 ---"
        draw_equilateral_triangle "$2"
        ;;
    *)
        echo "Utilisation: ./triangles.sh <type_triangle> <largeur_base_visuelle>"
        echo "Types: rectangle | isocèle | équilatéral"
        echo "Exemples:"
        echo "  ./triangles.sh rectangle 20"
        echo "  ./triangles.sh isocèle 21"
        echo "  ./triangles.sh équilatéral 25"
        exit 1
        ;;
esac