# ----------------------------------------------------------------------
# 🎧 SCRIPT COMPLET SONIC PI - MPD218 FULL CONTROL (48 Pads)
# Ce script gère 6 Knobs CC et 3 Banques de 16 Pads (A: 0-15, B: 16-31, C: 32-47).
# ----------------------------------------------------------------------

# ----------------------------------------------------------------------
# 1. CONFIGURATION GLOBALE, CC et Banques
# ----------------------------------------------------------------------
use_osc "127.0.0.1", 4560 

# Initialisation des variables d'état globales
set :master_amp, 10.0      # Knob 1 (CC 5) : Volume Maître (Inversé)
set :eq_bass, 100         # Knob 2 (CC 1) : EQ Basses (LPF Cutoff)
set :note_velocity, 1.0   # Knob 3 (CC 2) : Vélocité des Notes (0.5 à 1.2)
set :eq_band, 80          # Knob 4 (CC 3) : EQ Tonalité (BPF Center)
set :key_mode_index, 0    # Knob 5 (CC 4) : Index Tonalité (Cercle Chromatique)
set :eq_treble, 10        # Knob 6 (CC 5) : EQ Aigus (HPF Cutoff)

set :reverb_mix, 0.0
set :delay_mix, 0.0
set :is_running, 0

MIDI_PORT = "mpd218_port_a:6"
CC_MASTER_VOLUME = 5
CC_EQ_BASS = 1
CC_NOTE_VELOCITY = 2
CC_EQ_BAND_TONE = 3
CC_KEY_MODE_INDEX = 4
CC_EQ_TREBLE = 5

# --- Définitions des Banques de Sons ---

# Chemin des samples (laissé vide pour l'instant)
SAMPLE_PATH = "" 

# Format : [:type, :synth_source, note_ou_chemin_sample, {options_specifiques}]

# BANQUE A (Note MIDI 0-15) : Sons Électroniques Raffinés
BANK_A = [
  [:synth, :pulse, :c2, {release: 0.08, sustain: 0, pulse_width: 0.1, amp: 2.0}], # Pad 0 (Kick) - Simplifié
  [:synth, :noise, 1, {attack: 0.0001, release: 0.02, pan: 0.2, amp: 1.6}], # Pad 1 (Clic Souris)
  [:synth, :square, :f7, {release: 0.06, sustain: 0, pulse_width: 0.2, amp: 1.5}], # Pad 2 (Bip Erreur)
  [:synth, :gnoise, 1, {attack: 0.1, sustain: 1.0, release: 0.5, cutoff: 80, amp: 0.4}], # Pad 3 (Ambiance Statique)
  [:synth, :pluck, :e6, {release: 0.15, res: 0.9, amp: 1.7}], # Pad 4 (Snap/Notification)
  [:synth, :noise, 1, {attack: 0.001, release: 0.03, amp: 1.5}], # Pad 5 (Frappe Clavier 1)
  [:synth, :fm, :c7, {release: 0.1, divisor: 1.5, detune: 0.2, amp: 1.5}], # Pad 6 (Alarme Courte)
  [:synth, :cnoise, 1, {attack: 0.001, release: 0.04, pan: -0.2, amp: 1.5}], # Pad 7 (Frappe Clavier 2)
  [:synth, :saw, :c4, {attack: 0.01, release: 0.15, cutoff: 130, amp: 1.5}], # Pad 8 (Déconnexion USB - Simplifié)
  [:synth, :beep, :a5, {release: 0.04, amp: 1.5}], # Pad 9 (Bip Simple)
  [:synth, :beep, :c8, {release: 0.02, sustain: 0, amp: 2.0}], # Pad 10 (TICK - CORRIGÉ)
  [:synth, :prophet, :d4, {release: 0.1, detune: 0.05, amp: 1.5}], # Pad 11 (Blip Radar)
  [:synth, :square, :f5, {release: 0.09, pulse_width: 0.3, amp: 1.5}], # Pad 12 (Bulle Chat)
  [:synth, :dsaw, chord(:c5, :major7), {release: 0.3, detune: 0.5, amp: 1.5}], # Pad 13 (Sonnerie Tél.)
  [:synth, :hollow, :c3, {release: 0.25, detune: 5, res: 0.5, amp: 1.5}], # Pad 14 (Disque Dur)
  [:synth, :fm, :c4, {sustain: 1.5, release: 0.5, attack: 0.1, divisor: 2.0, amp: 0.9}], # Pad 15 (Vague IA)
]

# BANQUE B (Notes MIDI 16-31) : Pads Aléatoires (Synthèse de Test)
BANK_B = [
  [:synth, :fm, :c3, {divisor: 0.5, release: 0.2, amp: 1.5}],
  [:synth, :dsaw, chord(:e4, :minor), {release: 0.1, detune: 0.8, amp: 1.5}],
  [:synth, :saw, :c1, {attack: 1.0, release: 0.05, cutoff: 120, amp: 0.5}],
  [:synth, :prophet, :g5, {release: 0.1, amp: 1.5}],
  [:synth, :square, :a6, {release: 0.05, pulse_width: 0.5, amp: 1.5}],
  [:synth, :hollow, :c6, {release: 0.1, detune: 10, res: 0.8, amp: 1.5}],
  [:synth, :chipbass, :e3, {release: 0.3, wave: 3, amp: 0.8}],
  [:synth, :pluck, :c5, {release: 0.08, res: 0.5, amp: 1.5}],
  [:synth, :tri, :c4, {release: 0.1, cutoff: 60, amp: 1.5}],
  [:synth, :bnoise, 1, {attack: 0.001, release: 0.05, amp: 1.5}],
  [:synth, :beep, :c1, {release: 0.5, amp: 2.0}],
  [:synth, :sine, :d5, {release: 0.1, amp: 1.5}],
  [:synth, :pulse, :a3, {release: 0.08, pulse_width: 0.8, amp: 1.5}],
  [:synth, :square, 1, {attack: 0.0, release: 0.5, cutoff: 130, amp: 1.2}],
  [:synth, :chipbass, :g6, {release: 0.4, amp: 1.8}],
  [:synth, :piano, chord(:c4, :m7), {release: 0.8, amp: 1.0}],
]

# BANQUE C (Notes MIDI 32-47) : Pads Aléatoires (Synthèse de Test)
# BANQUE C (Notes MIDI 32-47) : Pads Aléatoires (Synthèse de Test)
BANK_C = [
  [:synth, :bass_foundation, 1, {release: 0.2, amp: 1.2}],
  [:synth, :prophet, :c3, {sustain: 2.0, release: 1.0, cutoff: 60, amp: 0.5}], # Pad 32 (Long Pad - CORRIGÉ)
  [:synth, :supersaw, :f4, {attack: 0.01, release: 0.1, amp: 1.5}],
  [:synth, :tb303, :g5, {release: 0.1, cutoff: 100, amp: 1.5}],
  [:synth, :beep, :a7, {release: 0.3, detune: 0.1, amp: 1.5}],
  [:synth, :tri, :c5, {release: 0.1, amp: 1.3}],
  [:synth, :cnoise, 1, {attack: 0.1, release: 0.5, cutoff: 100, amp: 1.5}],
  [:synth, :dpulse, :e4, {release: 0.5, sustain: 0.5, amp: 1.0}],
  [:synth, :saw, :c5, {release: 0.1, amp: 1.5}],
  [:synth, :dull_bell, 40, {release: 0.5, res: 0.9, amp: 1.5}],
  [:synth, :sine, :c6, {release: 0.05, attack: 0.001, amp: 1.5}],
  [:synth, :fm, :c5, {release: 0.5, amp: 1.5}],
  [:synth, :fm, :c3, {release: 0.5, amp: 1.5}],
  [:synth, :cnoise, 1, {release: 0.01, amp: 1.5}],
  [:synth, :dull_bell, :c4, {release: 0.8, amp: 1.5}],
  [:synth, :growl, :g3, {release: 0.2, sustain: 0.1, amp: 1.5}],
]


# ----------------------------------------------------------------------
# 2. GESTION DES CONTRÔLEURS MIDI CC (KNOBS)
# ----------------------------------------------------------------------
live_loop :cc_controls do
  use_real_time
  control_id, control_value, channel, port = sync "/midi:#{MIDI_PORT}/control_change"
  norm_v = control_value / 127.0
  
  case control_id
  when CC_MASTER_VOLUME
    inverted_norm_v = 1.0 - norm_v
    new_amp = inverted_norm_v * 1.5
    set :master_amp, new_amp
  when CC_EQ_BASS
    new_bass_cutoff = 40 + norm_v * (120 - 40)
    set :eq_bass, new_bass_cutoff
  when CC_NOTE_VELOCITY
    new_vel = 0.5 + norm_v * 0.7
    set :note_velocity, new_vel
  when CC_EQ_BAND_TONE
    new_band_freq = 40 + norm_v * (120 - 40)
    set :eq_band, new_band_freq
  when CC_KEY_MODE_INDEX
    circle_index = (norm_v * 12).floor
    set :key_mode_index, circle_index
  when CC_EQ_TREBLE
    new_treble_cutoff = 10 + norm_v * (50 - 10)
    set :eq_treble, new_treble_cutoff
  
  end
end


# ----------------------------------------------------------------------
# 3. GESTION DU TRANSPORT OSC (Play/Stop)
# ----------------------------------------------------------------------
live_loop :transport_control do
  use_real_time
  address, val = sync "/osc/transport/play", "/osc/transport/stop"
  
  if address == "/osc/transport/play"
    set :is_running, 1
    puts "TRANSPORT -> PLAY"
  elsif address == "/osc/transport/stop"
    set :is_running, 0
    puts "TRANSPORT -> STOP"
  end
end


# ----------------------------------------------------------------------
# 4. JEU DU SÉQUENCEUR MÉLODIQUE
# ----------------------------------------------------------------------
live_loop :sequencer_melody do
  use_real_time
  note_on, vel = sync "/osc/midi/play/note_on"
  rev_mix = get(:reverb_mix)
  eq_bass_val = get(:eq_bass)
  eq_treble_val = get(:eq_treble)
  eq_band_val = get(:eq_band)
  
  with_fx :reverb, mix: rev_mix do
    with_fx :lpf, cutoff: eq_bass_val do
      with_fx :hpf, cutoff: eq_treble_val do
        with_fx :bpf, centre: eq_band_val, res: 0.2 do
          use_synth :sine # Synthé numérique pour les mélodies
          synth_id = play note_on, amp: vel * 0.8, sustain: 4, release: 0.05
          note_off, _ = sync "/osc/midi/play/note_off", timeout: 0.01
          if note_off == note_on
            control synth_id, amp: 0, amp_slide: 0.01
          end
        end
      end
    end
  end
end


# ----------------------------------------------------------------------
# 5. BOUCLE D'ÉCOUTE DES PADS (GESTION MULTI-BANQUES A, B, C)
# ----------------------------------------------------------------------
live_loop :pad_midi_one_shots do
  use_real_time
  note, velocity = sync "/midi:#{MIDI_PORT}/note_on" 
  amp_v = velocity / 127.0
  master_volume = get(:master_amp)

  # Déterminer l'index de la banque (0, 1, ou 2) et l'index du pad (0-15)
  bank_index = (note / 16).floor 
  pad_index  = note % 16         
  
  all_banks = [BANK_A, BANK_B, BANK_C]
  
  if bank_index >= all_banks.size || pad_index >= all_banks[bank_index].size
    puts "Pad #{note} (Bank #{bank_index}, Pad #{pad_index}) non configuré ou hors limite."
    next
  end

  # Récupérer les données du pad
  pad_config = all_banks[bank_index][pad_index]
  type, source, note_or_sample_path, opts = pad_config[0], pad_config[1], pad_config[2], pad_config[3]
  
  # Récupération des contrôles d'EQ/FX globaux
  rev_mix = get(:reverb_mix)
  dly_mix = get(:delay_mix)
  eq_bass_val = get(:eq_bass)
  eq_treble_val = get(:eq_treble)
  eq_band_val = get(:eq_band)
  
  # Chaîne d'effets appliquée
  with_fx :reverb, mix: rev_mix do
    with_fx :echo, mix: dly_mix, phase: 0.25 do
      with_fx :lpf, cutoff: eq_bass_val do
        with_fx :hpf, cutoff: eq_treble_val do
          with_fx :bpf, centre: eq_band_val, res: 0.2 do
            
            # Calculer l'amplitude finale
            final_amp = amp_v * master_volume * (opts[:amp] || 1.0)
            
            # Filtrer l'option 'amp' avant de la passer à play
            filtered_opts = opts.reject { |k, v| k == :amp } 
            
            if type == :synth
              use_synth source 
              # Jouer le son. Si c'est un synthé, on joue la note/chord.
              play note_or_sample_path, filtered_opts.merge(amp: final_amp)
              
            elsif type == :sample 
              # Si on est sur un sample mais que le chemin est vide, on joue un beep de sécurité
              if source.empty?
                 use_synth :beep
                 play :c3, amp: final_amp * 0.5, release: 0.05
              else
                 # C'est la ligne qui sera utilisée pour vos futurs fichiers .wav
                 sample source, note_or_sample_path, filtered_opts.merge(amp: final_amp)
              end
            end
            
            # Envoi OSC pour le front-end
            osc "/pad/#{note}/press", amp_v
            
          end
        end
      end
    end
  end
end