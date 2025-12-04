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
INTERFACE_WIDTH=60

# Contenu par défaut
DEFAULT_MENU_TITLE="codex"
DEFAULT_CONTENT_LINES=(
  "Bienvenue dans votre tableau de bord."
  "Statut: ✅ Connecté"
  "Dernière activité: il y a 5 min"
)
DEFAULT_PROGRESS_ICONS="💻.📡/<:"
DEFAULT_PROGRESS_SATELLITE="🛰"

# --- Fonctions de Génération des Segments ---

# 1. Bordure Supérieure
draw_top_border() {
    echo -n "${BORDER_TOP_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 2)))
    echo "${BORDER_TOP_RIGHT}"
}

# 2. Barre de Titre et Menu de Navigation
draw_menu_bar() {
    local menu_title="${1:-$DEFAULT_MENU_TITLE}"
    local left_icons="${2:-📗 📕 📒}"
    local right_icon="${3:->}"

    local content_length=$(( ${#left_icons} + 3 + ${#menu_title} + 3 + ${#right_icon} ))
    local padding_length=$(( INTERFACE_WIDTH - 2 - content_length ))
    local left_padding=$(( padding_length / 2 ))
    local right_padding=$(( padding_length - left_padding ))

    local left_fill="┈┈"
    local right_fill="┈┈"

    echo -n "${BORDER_VERTICAL}"
    echo -n "${left_icons}:/${left_fill}"
    echo -n "{[${left_fill}${menu_title}${right_fill}]}"
    echo -n "${right_fill}${right_icon}"

    remaining_fill=$(( INTERFACE_WIDTH - 2 - ( ${#left_icons} + 1 + ${#left_fill} + 1 + ${#left_fill} + ${#menu_title} + ${#right_fill} + 1 + ${#right_fill} + ${#right_icon} + 1 ) ))
    printf " %.0s" $(seq 1 $remaining_fill)

    echo "${BORDER_VERTICAL}"
}

# Fonction pour générer un triangle simple (plein, pointé vers le haut)
# Note : Pour un rendu visuellement "carré", nous ajustons la hauteur du triangle pour qu'il paraisse équilibré
# 3 lignes de hauteur pour un triangle simple et visible dans la zone de contenu
generate_simple_triangle_up() {
    # Largeur de la zone de contenu de droite : INTERFACE_WIDTH - 14 (10 pour le panneau gauche + 2 pour les bordures)
    local content_area_width=$(( INTERFACE_WIDTH - 14 ))

    # Définir la largeur de base visuelle du triangle pour un bon rendu
    local triangle_base_visual_width=12 # Une largeur fixe pour un bon rendu dans la zone

    # Calcul de l'offset pour centrer le triangle
    local offset=$(( (content_area_width - triangle_base_visual_width) / 2 ))
    if (( offset < 0 )); then offset=0; fi # Éviter les offsets négatifs

    local pad_offset=""
    printf -v pad_offset " %.0s" $(seq 1 $offset)

    local triangle_lines=(
        "${pad_offset}      /\\      " # Ligne 1
        "${pad_offset}     /  \\     " # Ligne 2
        "${pad_offset}    /____\\    " # Ligne 3
    )
    echo "${triangle_lines[0]}"
    echo "${triangle_lines[1]}"
    echo "${triangle_lines[2]}"
}


# 3. Panneaux de Zone de Contenu
# Crée les séparateurs et les lignes pour le contenu.
# Args: $1 = Type de contenu ("text", "triangle")
#       $@ = Tableau de lignes de contenu (si type est "text")
draw_content_panels() {
    local content_type="$1"
    shift # Supprime le premier argument pour ne garder que le reste
    local -a content_lines=("$@") # Le reste des arguments est le contenu texte

    local max_content_length=$(( INTERFACE_WIDTH - 14 )) # Largeur du panneau de droite

    # Ligne de séparation des panneaux
    echo -n "${BORDER_MIDDLE_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 10)
    echo -n "${BORDER_MIDDLE_TOP}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 13)))
    echo "${BORDER_MIDDLE_RIGHT}"

    # Lignes de contenu
    for i in $(seq 0 2); do # 3 lignes de contenu dans le panneau de droite
        echo -n "${BORDER_VERTICAL}"
        printf " %.0s" $(seq 1 10) # Espaces pour le panneau gauche
        echo -n "${BORDER_VERTICAL}"

        if [[ "$content_type" == "triangle" ]]; then
            # Si le type est triangle, nous insérons le triangle ici
            # Gérer le centre du triangle sur 3 lignes
            if [[ $i -eq 0 ]]; then
                generate_simple_triangle_up | head -n 1 | tr -d '\n' # Première ligne du triangle
            elif [[ $i -eq 1 ]]; then
                generate_simple_triangle_up | head -n 2 | tail -n 1 | tr -d '\n' # Deuxième ligne
            elif [[ $i -eq 2 ]]; then
                generate_simple_triangle_up | head -n 3 | tail -n 1 | tr -d '\n' # Troisième ligne
            fi
        else # Type est "text" ou autre, affiche le contenu texte
            local line_content=""
            if [[ $i -lt ${#content_lines[@]} ]]; then
                line_content="${content_lines[$i]}"
            fi
            local padding_needed=$(( max_content_length - ${#line_content} ))
            echo -n "${line_content}"
            printf " %.0s" $(seq 1 $padding_needed)
        fi
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
draw_status_bar() {
    local progress_percent="${1:-50}"
    local left_icons="${2:-$DEFAULT_PROGRESS_ICONS}"
    local right_icon="${3:-$DEFAULT_PROGRESS_SATELLITE}"

    local bar_length=$(( INTERFACE_WIDTH - ${#left_icons} - ${#right_icon} - 5 ))
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
draw_bottom_border() {
    echo -n "${BORDER_BOTTOM_LEFT}"
    printf "${BORDER_HORIZONTAL}%.0s" $(seq 1 $((INTERFACE_WIDTH - 2)))
    echo "${BORDER_BOTTOM_RIGHT}"
}

# --- Fonction Principale de Génération ---
# Args: $1 = Titre du menu
#       $2 = Type de contenu pour le panneau ("text" ou "triangle")
#       $3... (optionnel) = Lignes de contenu si type est "text"
#       Dernier arg = Progression (0-100)
generate_interface() {
    local custom_title="${1}"
    local content_type="${2}" # "text" ou "triangle"
    local -a custom_content=()
    local progress_value=0

    # Déterminer les arguments du contenu et la progression
    # Si le type est "text", les arguments suivants (jusqu'à l'avant-dernier) sont le contenu.
    # Le dernier argument est toujours la progression.
    local last_arg_index=$(($# - 1))
    progress_value="${!last_arg_index}" # Récupère la dernière valeur comme progression

    if [[ "$content_type" == "text" ]]; then
        # Copier tous les arguments du 3ème (inclu) jusqu'à l'avant-dernier dans custom_content
        for ((i=3; i <= last_arg_index; i++)); do
            custom_content+=("${!i}")
        done
        # Utilise le contenu par défaut si custom_content est vide
        if [ ${#custom_content[@]} -eq 0 ]; then
            custom_content=("${DEFAULT_CONTENT_LINES[@]}")
        fi
    fi


    draw_top_border
    draw_menu_bar "$custom_title" "📗 📕 📒" ">"
    draw_content_panels "$content_type" "${custom_content[@]}"
    draw_status_bar "$progress_value" "$DEFAULT_PROGRESS_ICONS" "$DEFAULT_PROGRESS_SATELLITE"
    draw_bottom_border
}

# --- Utilisation du Script ---
echo "--- Interface avec Texte par défaut ---"
generate_interface "Codex Console" "text" 50

echo ""

echo "--- Interface avec un Triangle ---"
generate_interface "Graphiques" "triangle" 75

echo ""

echo "--- Interface avec Texte personnalisé ---"
generate_interface "Stats du Jour" "text" "Ventes: +15%" "Nouveaux inscrits: 12" "Support: 2 en attente" 90