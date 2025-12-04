#!/bin/bash

# ===============================================
# interface.sh - Script pour générer une interface graphique en Art ASCII
# ===============================================

# --- Variables Globales ---
# Les caractères utilisés pour construire l'interface.
# Vous pouvez les modifier pour changer le style.
BORDER_TOP_LEFT="╔"
BORDER_TOP_RIGHT="╗"
BORDER_BOTTOM_LEFT="╚"
BORDER_BOTTOM_RIGHT="╝"
BORDER_HORIZONTAL="═"
BORDER_VERTICAL="║"
BORDER_MIDDLE_LEFT="╠"
BORDER_MIDDLE_RIGHT="╣"
BORDER_MIDDLE_TOP="╦"
BORDER_MIDDLE_BOTTOM="╩"

# Longueur de l'interface (peut être ajustée)
INTERFACE_WIDTH=80

# Contenu par défaut
DEFAULT_MENU_TITLE="codex"
DEFAULT_CONTENT_LINES=(
  "Bienvenue dans votre tableau de bord."
  "Statut: ✅ Connecté"
  "Dernière activité: il y a 5 min"
)
DEFAULT_PROGRESS_ICONS="[💻.📡]<:"
DEFAULT_PROGRESS_SATELLITE="🛰"


# --- Fonctions de Génération des Segments ---

# 1. Bordure Supérieure
# Dessine la ligne supérieure de l'interface.
draw_top_border() {
    echo -n "${BORDER_TOP_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 2)))
    echo "${BORDER_TOP_RIGHT}"
}

# 2. Barre de Titre et Menu de Navigation
# Affiche les icônes, le titre et la flèche de navigation.
# Args: $1 = Titre du menu (e.g., "codex")
#       $2 = Icônes de gauche (e.g., "📗 📕 📒")
#       $3 = Icône de droite (e.g., ">")
draw_menu_bar() {
    local menu_title="${1:-$DEFAULT_MENU_TITLE}"
    local left_icons="${2:-📗 📕 📒}"
    local right_icon="${3:->}"

    local content_length=$(( ${#left_icons} + 3 + ${#menu_title} + 3 + ${#right_icon} )) # Ex: [📗 📕 📒]:/┈┈┈┈┈┈┈┈{[┈┈┈┈codex┈┈┈┈┈]}┈┈┈┈┈┈┈┈>
    local padding_length=$(( INTERFACE_WIDTH - 2 - content_length ))
    local left_padding=$(( padding_length / 2 ))
    local right_padding=$(( padding_length - left_padding ))

    local left_fill="┈┈┈┈┈┈┈┈┈┈┈┈" # Remplissage avant le titre
    local right_fill="┈┈┈┈┈┈┈┈┈┈┈" # Remplissage après le titre

    echo -n "${BORDER_VERTICAL}"
    echo -n "${left_icons}:/${left_fill}"
    echo -n "{[${left_fill}${menu_title}${right_fill}]}"
    echo -n "${right_fill}${right_icon}"
    
    # Ajuster le remplissage restant pour atteindre la largeur totale
    remaining_fill=$(( INTERFACE_WIDTH - 2 - ( ${#left_icons} + 1 + ${#left_fill} + 1 + ${#left_fill} + ${#menu_title} + ${#right_fill} + 1 + ${#right_fill} + ${#right_icon} + 1 ) ))
    printf " %.0s" $(seq 1 $remaining_fill) # Ajouter des espaces pour compenser
    
    echo "${BORDER_VERTICAL}"
}


# 3. Panneaux de Zone de Contenu
# Crée les séparateurs et les lignes pour le contenu.
# Args: $@ = Tableau de lignes de contenu (optionnel)
draw_content_panels() {
    local content_lines=("$@")
    local num_content_lines=${#content_lines[@]}
    local max_content_length=$(( INTERFACE_WIDTH - 14 )) # Largeur du panneau de droite

    # Ligne de séparation des panneaux
    echo -n "${BORDER_MIDDLE_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 10) # Largeur du panneau gauche (peut être ajustée)
    echo -n "${BORDER_MIDDLE_TOP}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 13)))
    echo "${BORDER_MIDDLE_RIGHT}"

    # Lignes de contenu
    for i in $(seq 0 2); do # 3 lignes de contenu
        local line_content=""
        if [[ $i -lt $num_content_lines ]]; then
            line_content="${content_lines[$i]}"
        fi
        local padding_needed=$(( max_content_length - ${#line_content} ))
        
        echo -n "${BORDER_VERTICAL}"
        printf " %.0s" $(seq 1 10) # Espaces pour le panneau gauche
        echo -n "${BORDER_VERTICAL}"
        echo -n "${line_content}"
        printf " %.0s" $(seq 1 $padding_needed)
        echo "${BORDER_VERTICAL}"
    done

    # Ligne de séparation basse des panneaux (avant la barre d'état)
    echo -n "${BORDER_MIDDLE_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 10)
    echo -n "${BORDER_MIDDLE_BOTTOM}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 13)))
    echo "${BORDER_MIDDLE_RIGHT}"
}

# 4. Barre d'État / Progression
# Affiche les icônes de la barre d'état et la barre de progression.
# Args: $1 = Progression en pourcentage (0-100)
#       $2 = Icônes de gauche (e.g., "💻.📡/<:")
#       $3 = Icône de droite (e.g., "🛰")
draw_status_bar() {
    local progress_percent="${1:-50}" # Valeur par défaut 50%
    local left_icons="${2:-$DEFAULT_PROGRESS_ICONS}"
    local right_icon="${3:-$DEFAULT_PROGRESS_SATELLITE}"

    local bar_length=$(( INTERFACE_WIDTH - ${#left_icons} - ${#right_icon} - 5 )) # Taille de la barre de progression
    local filled_length=$(( (bar_length * progress_percent) / 100 ))
    local empty_length=$(( bar_length - filled_length ))

    echo -n "${BORDER_VERTICAL}"
    echo -n "${left_icons} "
    printf "█%.0s" $(seq 1 $filled_length)
    printf "░%.0s" $(seq 1 $empty_length)
    echo -n " ${right_icon} "
    echo "${BORDER_VERTICAL}"
}

# 5. Bordure Inférieure
# Dessine la ligne inférieure de l'interface.
draw_bottom_border() {
    echo -n "${BORDER_BOTTOM_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 2)))
    echo "${BORDER_BOTTOM_RIGHT}"
}

# --- Fonction Principale de Génération ---
generate_interface() {
    local custom_title="${1}"
    local -a custom_content=("${@:2:$(( ${#@} - 2 ))}") # Récupérer les lignes de contenu
    local progress_value="${@: -1}" # Dernière valeur est la progression

    # Utilise le contenu par défaut si rien n'est fourni
    if [ ${#custom_content[@]} -eq 0 ]; then
        custom_content=("${DEFAULT_CONTENT_LINES[@]}")
    fi

    draw_top_border
    draw_menu_bar "$custom_title" "📗 📕 📒" ">"
    draw_content_panels "${custom_content[@]}"
    draw_status_bar "$progress_value" "$DEFAULT_PROGRESS_ICONS" "$DEFAULT_PROGRESS_SATELLITE"
    draw_bottom_border
}

# --- Utilisation du Script ---
# Pour lancer le script :
# bash interface.sh
# ou
# chmod +x interface.sh
# ./interface.sh

# Exemple d'appel pour générer l'interface par défaut
echo "--- Interface par défaut ---"
generate_interface "codex" "${DEFAULT_CONTENT_LINES[@]}" 50

echo ""

# Exemple d'appel avec un titre et du contenu personnalisés et une progression spécifique
echo "--- Interface personnalisée ---"
generate_interface "Mon App" "Utilisateurs actifs: 125" "Statut: En ligne" "Version: 1.0.1" 85

echo ""

# Exemple d'appel avec juste un titre et une progression, utilisant le contenu par défaut
echo "--- Interface simplifiée (contenu par défaut) ---"
generate_interface "Dashboard" "${DEFAULT_CONTENT_LINES[@]}" 25