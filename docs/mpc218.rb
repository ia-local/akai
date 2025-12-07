use_osc "127.0.0.1", 4560

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

# 2. GESTION DES CONTRÔLEURS MIDI CC (KNOBS)
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

# 3. GESTION DU TRANSPORT OSC (Play/Stop)
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

# 4. JEU DU SÉQUENCEUR MÉLODIQUE
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
# 5. BOUCLE D'ÉCOUTE DES PADS (SYNTHÈSE BRUITS ÉLECTRONIQUES OPTIMISÉE)
live_loop :pad_midi_one_shots do
  use_real_time
  note, velocity = sync "/midi:#{MIDI_PORT}/note_on" 
  amp_v = velocity / 127.0
  
  master_volume = get(:master_amp)
  rev_mix = get(:reverb_mix)
  dly_mix = get(:delay_mix)
  eq_bass_val = get(:eq_bass)
  eq_treble_val = get(:eq_treble)
  eq_band_val = get(:eq_band)
  
  with_fx :reverb, mix: rev_mix do
    with_fx :echo, mix: dly_mix, phase: 0.25 do
      with_fx :lpf, cutoff: eq_bass_val do
        with_fx :hpf, cutoff: eq_treble_val do
          with_fx :bpf, centre: eq_band_val, res: 0.2 do # Ce FX gère le filtrage global
            
            # MAPPING INTÉGRAL DES 16 PADS (Synthèse Électronique Raffinée)
            
            case note
            
            # LIGNE 1 : KICK, CLIC, BIP ERREUR, AMBIANCE
            when 0 # Pad 16 -> KICK / Boot PC (Impulsion Basse avec Ring Mod)
              with_fx :ring_mod, freq: 50, mix: 0.3 do
                use_synth :pulse
                play :c2, amp: amp_v * 2.0 * master_volume, release: 0.08, sustain: 0, pulse_width: 0.1
              end
            when 1 # Pad 1 -> SNARE / Clic de Souris (Bruit ultra sec et aigu)
              use_synth :noise
              play 1, amp: amp_v * 1.6 * master_volume, attack: 0.0001, release: 0.02, pan: 0.2
            when 2 # Pad 2 -> COWBELL / Bip d'Erreur (Onde carrée aigüe et courte)
              use_synth :square
              play :f7, amp: amp_v * 1.5 * master_volume, release: 0.06, sustain: 0, pulse_width: 0.2
            when 3 # Pad 3 -> AMBIENCE FX / Bruit de Fond Statique (Tonalité Basse Soutenue)
              use_synth :gnoise
              play 1, amp: amp_v * 0.4 * master_volume, attack: 0.1, sustain: 1.0, release: 0.5, cutoff: 80
              
            # LIGNE 2 : NOTIFICATION, FRAPPE CLAVIER, ALARME COURTE
            when 4 # Pad 4 -> SNAP / Notification Tél. (Pluck résonant)
              use_synth :pluck
              play :e6, amp: amp_v * 1.7 * master_volume, release: 0.15, res: 0.9
            when 5 # Pad 5 -> HI SNARE / Frappe Clavier 1 (CORRIGÉ : Bruit sec)
              use_synth :noise # ✅ CORRECTION
              play 1, amp: amp_v * 1.5 * master_volume, attack: 0.001, release: 0.03 # Utilisation d'une enveloppe noise
            when 6 # Pad 6 -> BLIP / Son d'Alarme Court (FM avec un pitch déclinant)
              use_synth :fm
              play :c7, amp: amp_v * 1.5 * master_volume, release: 0.1, divisor: 1.5, detune: 0.2
            when 7 # Pad 7 -> HI SNARE / Frappe Clavier 2 (Bruit de cliquetis fin)
              use_synth :cnoise
              play 1, amp: amp_v * 1.5 * master_volume, attack: 0.001, release: 0.04, pan: -0.2
              
            # LIGNE 3 : DÉCONNEXION USB, BIP SIMPLE, TICK, BLIP RADAR
            when 8 # Pad 8 -> ELEC SNARE / Déconnexion USB (Sweep de filtre)
              use_synth :saw
              synth_id = play :c4, amp: amp_v * 1.5 * master_volume, attack: 0.01, release: 0.15, cutoff_slide: 0.1, cutoff: 130
              control synth_id, cutoff: 50 
            when 9 # Pad 9 -> BEEP / Bip simple (Beep clair)
              use_synth :beep
              play :a5, amp: amp_v * 1.5 * master_volume, release: 0.04
            when 10 # Pad 10 -> TICK / Tic-tac (Correction Définitive : Utilisation de :beep)
              use_synth :beep
              # Note très haute et release minimal garanti de fonctionner
              play :c8, amp: amp_v * 2.0 * master_volume, release: 0.02, sustain: 0
            when 11 # Pad 11 -> BLIP / Blip de Radar (Prophet modulé)
              use_synth :prophet
              play :d4, amp: amp_v * 1.5 * master_volume, release: 0.1, detune: 0.05
            # LIGNE 4 : BULLE CHAT, SONNERIE, DISQUE DUR, VAGUE IA
            when 12 # Pad 12 -> PLIP / Bulle de Chat (Square simple et doux)
              use_synth :square
              play :f5, amp: amp_v * 1.5 * master_volume, release: 0.09, pulse_width: 0.3
            when 13 # Pad 13 -> PING / Sonnerie de Tél. (DSaw plus complexe)
              use_synth :dsaw
              play chord(:c5, :major7), amp: amp_v * 1.5 * master_volume, release: 0.3, detune: 0.5
            when 14 # Pad 14 -> TWANG / Son de Disque Dur (Hollow résonant)
              use_synth :hollow
              play :c3, amp: amp_v * 1.5 * master_volume, release: 0.25, detune: 5, res: 0.5
            when 15 # Pad 15 -> LOOP / Vague sonore d'IA (FM large)
              use_synth :fm
              play :c4, amp: amp_v * 0.9 * master_volume, sustain: 1.5, release: 0.5, attack: 0.1, divisor: 2.0
              
            end # Fin du case note
            
            # Envoi du message OSC après la lecture du son (pour les 16 pads)
            osc "/pad/#{note}/press", amp_v
            
          end
        end
      end
    end
  end
end