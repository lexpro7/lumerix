import { segmentMessages } from "./segment-translations";
// English source text → Russian, French, German, Italian, Spanish.
// Keep technical identifiers and user-authored names outside this catalogue.
const rows = `
Settings|Настройки|Paramètres|Einstellungen|Impostazioni|Ajustes
Close settings|Закрыть настройки|Fermer les paramètres|Einstellungen schließen|Chiudi impostazioni|Cerrar ajustes
Appearance|Оформление|Apparence|Darstellung|Aspetto|Apariencia
Dark|Тёмная|Sombre|Dunkel|Scuro|Oscuro
Light theme|Светлая|Clair|Hell|Chiaro|Claro
Interface language|Язык интерфейса|Langue de l’interface|Sprache der Oberfläche|Lingua dell’interfaccia|Idioma de la interfaz
Preferences are saved on this device. Changes apply instantly.|Настройки сохраняются на этом устройстве и применяются сразу.|Les préférences sont enregistrées sur cet appareil et appliquées immédiatement.|Einstellungen werden auf diesem Gerät gespeichert und sofort angewendet.|Le preferenze sono salvate su questo dispositivo e applicate subito.|Las preferencias se guardan en este dispositivo y se aplican al instante.
Preferences could not be saved. They will apply for this session.|Не удалось сохранить настройки. Они действуют до конца сеанса.|Impossible d’enregistrer les préférences. Elles restent actives pour cette session.|Einstellungen konnten nicht gespeichert werden. Sie gelten für diese Sitzung.|Impossibile salvare le preferenze. Restano attive per questa sessione.|No se pudieron guardar las preferencias. Se aplicarán durante esta sesión.
Edit|Правка|Retouche|Bearbeiten|Modifica|Editar
AI Tools|ИИ-инструменты|Outils IA|KI-Werkzeuge|Strumenti IA|Herramientas IA
Color DNA|ДНК цвета|ADN couleur|Farb-DNA|DNA del colore|ADN de color
Looks|Стили|Styles|Looks|Stili|Estilos
Crop|Кадрирование|Recadrage|Zuschnitt|Ritaglio|Recortar
Enhance|Улучшение|Amélioration|Verbessern|Migliora|Mejorar
Light, color and fine adjustments|Свет, цвет и точные настройки|Lumière, couleur et réglages fins|Licht, Farbe und Feinabstimmung|Luce, colore e regolazioni fini|Luz, color y ajustes finos
Smart selections and local adjustments|Умное выделение и локальная коррекция|Sélections intelligentes et réglages locaux|Intelligente Auswahl und lokale Anpassungen|Selezioni intelligenti e regolazioni locali|Selecciones inteligentes y ajustes locales
Match a reference atmosphere|Перенос атмосферы образца|Reproduire l’ambiance d’une référence|Referenzstimmung übernehmen|Riproduci l’atmosfera di un riferimento|Reproducir la atmósfera de una referencia
Presets, palettes and LUT Studio|Пресеты, палитры и LUT-студия|Préréglages, palettes et studio LUT|Vorgaben, Paletten und LUT-Studio|Predefiniti, palette e studio LUT|Preajustes, paletas y estudio LUT
Crop, rotate, flip and straighten|Кадрирование, поворот, отражение и выравнивание|Recadrer, tourner, retourner et redresser|Zuschneiden, drehen, spiegeln und begradigen|Ritaglia, ruota, rifletti e raddrizza|Recortar, girar, voltear y enderezar
Fast or AI 2x upscaling|Быстрое или ИИ-увеличение 2×|Agrandissement 2× rapide ou IA|Schnelle oder KI-Vergrößerung 2×|Ingrandimento 2× rapido o IA|Ampliación 2× rápida o con IA
A fresh perspective|Новый взгляд|Un nouveau regard|Eine neue Perspektive|Una nuova prospettiva|Una nueva perspectiva
Non-destructive editing|Неразрушающая обработка|Retouche non destructive|Nichtdestruktive Bearbeitung|Modifica non distruttiva|Edición no destructiva
Private. Local. Yours.|Приватно. Локально. Ваше.|Privé. Local. À vous.|Privat. Lokal. Deins.|Privato. Locale. Tuo.|Privado. Local. Tuyo.
Undo|Отменить|Annuler|Rückgängig|Annulla|Deshacer
Redo|Повторить|Rétablir|Wiederholen|Ripeti|Rehacer
Undo (Ctrl/Cmd Z)|Отменить (Ctrl/Cmd Z)|Annuler (Ctrl/Cmd Z)|Rückgängig (Ctrl/Cmd Z)|Annulla (Ctrl/Cmd Z)|Deshacer (Ctrl/Cmd Z)
Redo (Ctrl/Cmd Shift Z)|Повторить (Ctrl/Cmd Shift Z)|Rétablir (Ctrl/Cmd Shift Z)|Wiederholen (Ctrl/Cmd Shift Z)|Ripeti (Ctrl/Cmd Shift Z)|Rehacer (Ctrl/Cmd Shift Z)
History|История|Historique|Verlauf|Cronologia|Historial
History & shortcuts (?)|История и сочетания клавиш (?)|Historique et raccourcis (?)|Verlauf und Tastenkürzel (?)|Cronologia e scorciatoie (?)|Historial y atajos (?)
New session|Новый сеанс|Nouvelle session|Neue Sitzung|Nuova sessione|Nueva sesión
Install|Установить|Installer|Installieren|Installa|Instalar
Export|Экспорт|Exporter|Exportieren|Esporta|Exportar
Dismiss error|Скрыть ошибку|Fermer l’erreur|Fehler schließen|Chiudi errore|Cerrar error
Session history|История сеанса|Historique de la session|Sitzungsverlauf|Cronologia della sessione|Historial de la sesión
Ctrl/Cmd Z · undo|Ctrl/Cmd Z · отменить|Ctrl/Cmd Z · annuler|Ctrl/Cmd Z · rückgängig|Ctrl/Cmd Z · annulla|Ctrl/Cmd Z · deshacer
Ctrl/Cmd Shift Z · redo|Ctrl/Cmd Shift Z · повторить|Ctrl/Cmd Shift Z · rétablir|Ctrl/Cmd Shift Z · wiederholen|Ctrl/Cmd Shift Z · ripeti|Ctrl/Cmd Shift Z · rehacer
B · before/after · F · fit|B · до/после · F · вписать|B · avant/après · F · ajuster|B · vorher/nachher · F · einpassen|B · prima/dopo · F · adatta|B · antes/después · F · ajustar
Escape · leave selection|Escape · выйти из выделения|Échap · quitter la sélection|Escape · Auswahl verlassen|Esc · esci dalla selezione|Escape · salir de la selección
Your next edit will appear here.|Следующая правка появится здесь.|Votre prochaine retouche apparaîtra ici.|Deine nächste Änderung erscheint hier.|La prossima modifica apparirà qui.|Tu próxima edición aparecerá aquí.
Editing workspaces|Рабочие области|Espaces de retouche|Bearbeitungsbereiche|Aree di modifica|Espacios de edición
ON DEVICE|НА УСТРОЙСТВЕ|SUR L’APPAREIL|AUF DEM GERÄT|SUL DISPOSITIVO|EN EL DISPOSITIVO
MAKE IT YOURS|ВАШ СТИЛЬ|À VOTRE IMAGE|DEIN STIL|IL TUO STILE|TU ESTILO
Close tools|Закрыть инструменты|Fermer les outils|Werkzeuge schließen|Chiudi strumenti|Cerrar herramientas
Control density|Уровень настроек|Niveau des réglages|Umfang der Regler|Livello dei controlli|Nivel de controles
Beginner|Базовый|Simple|Einfach|Base|Básico
Advanced|Расширенный|Avancé|Erweitert|Avanzato|Avanzado
Search editing tools|Поиск инструментов|Rechercher des outils|Werkzeuge suchen|Cerca strumenti|Buscar herramientas
Find a tool…|Найти инструмент…|Trouver un outil…|Werkzeug suchen…|Trova uno strumento…|Buscar una herramienta…
Clear search|Очистить поиск|Effacer la recherche|Suche löschen|Cancella ricerca|Borrar búsqueda
No tools match. Try “sky”, “curve” or “exposure”.|Ничего не найдено. Попробуйте «небо», «кривая» или «экспозиция».|Aucun outil trouvé. Essayez « ciel », « courbe » ou « exposition ».|Keine Treffer. Versuche „Himmel“, „Kurve“ oder „Belichtung“.|Nessun risultato. Prova «cielo», «curva» o «esposizione».|Sin resultados. Prueba «cielo», «curva» o «exposición».
Source photograph|Исходная фотография|Photo source|Originalfoto|Foto originale|Fotografía original
Open your photograph|Откройте фотографию|Ouvrir votre photo|Foto öffnen|Apri la tua foto|Abre tu fotografía
Target|Фотография|Photo cible|Zielfoto|Foto di destinazione|Foto de destino
Reference|Образец|Référence|Referenz|Riferimento|Referencia
target|фотографию|photo cible|Zielfoto|foto|foto
reference|образец|référence|Referenz|riferimento|referencia
Ready|Готово|Prêt|Bereit|Pronto|Listo
Upscaling|Увеличение|Agrandissement|Vergrößerung|Ingrandimento|Ampliando
Developing|Обработка|Développement|Entwicklung|Elaborazione|Procesando
Reading image|Чтение изображения|Lecture de l’image|Bild wird gelesen|Lettura immagine|Leyendo imagen
Your photograph is the starting point.|Всё начинается с вашей фотографии.|Tout commence par votre photo.|Dein Foto ist der Ausgangspunkt.|La tua foto è il punto di partenza.|Tu fotografía es el punto de partida.
Local processing|Локальная обработка|Traitement local|Lokale Verarbeitung|Elaborazione locale|Procesamiento local
Offline mode|Автономный режим|Mode hors ligne|Offline-Modus|Modalità offline|Modo sin conexión
{0} masks · {1} reversible edits|Масок: {0} · Обратимых правок: {1}|{0} masques · {1} retouches réversibles|{0} Masken · {1} umkehrbare Änderungen|{0} maschere · {1} modifiche reversibili|{0} máscaras · {1} ediciones reversibles
Reset group|Сбросить группу|Réinitialiser le groupe|Gruppe zurücksetzen|Ripristina gruppo|Restablecer grupo
Reset {0}|Сбросить: {0}|Réinitialiser : {0}|Zurücksetzen: {0}|Ripristina: {0}|Restablecer: {0}
Light|Свет|Lumière|Licht|Luce|Luz
Color|Цвет|Couleur|Farbe|Colore|Color
Exposure|Экспозиция|Exposition|Belichtung|Esposizione|Exposición
Contrast|Контраст|Contraste|Kontrast|Contrasto|Contraste
Highlights|Светлые тона|Hautes lumières|Lichter|Alte luci|Iluminaciones
Shadows|Тени|Ombres|Tiefen|Ombre|Sombras
Saturation|Насыщенность|Saturation|Sättigung|Saturazione|Saturación
Temperature|Температура|Température|Temperatur|Temperatura|Temperatura
Tint|Оттенок|Teinte|Tönung|Tinta|Matiz
Clarity|Чёткость|Clarté|Klarheit|Chiarezza|Claridad
Vignette|Виньетка|Vignettage|Vignette|Vignettatura|Viñeta
Grain|Зерно|Grain|Körnung|Grana|Grano
Sharpness|Резкость|Netteté|Schärfe|Nitidezza|Nitidez
Noise smoothing|Сглаживание шума|Lissage du bruit|Rauschglättung|Riduzione del rumore|Suavizado de ruido
Color Mixer · HSL|Смешение цветов · HSL|Mélangeur de couleurs · HSL|Farbmischer · HSL|Mixer colori · HSL|Mezclador de colores · HSL
Color Grading|Тонирование|Étalonnage couleur|Color Grading|Color grading|Gradación de color
Effects|Эффекты|Effets|Effekte|Effetti|Efectos
Detail|Детали|Détail|Details|Dettagli|Detalle
Tone Curve|Тоновая кривая|Courbe des tonalités|Gradationskurve|Curva tonale|Curva de tonos
RGB tone curve|Тоновая кривая RGB|Courbe des tonalités RVB|RGB-Gradationskurve|Curva tonale RGB|Curva de tonos RGB
Red|Красный|Rouge|Rot|Rosso|Rojo
Orange|Оранжевый|Orange|Orange|Arancione|Naranja
Yellow|Жёлтый|Jaune|Gelb|Giallo|Amarillo
Green|Зелёный|Vert|Grün|Verde|Verde
Aqua|Бирюзовый|Turquoise|Türkis|Acquamarina|Aguamarina
Blue|Синий|Bleu|Blau|Blu|Azul
Purple|Фиолетовый|Violet|Violett|Viola|Violeta
Magenta|Пурпурный|Magenta|Magenta|Magenta|Magenta
Hue|Цветовой тон|Teinte|Farbton|Tonalità|Tono
Lightness|Светлота|Luminosité|Helligkeit|Luminosità|Luminosidad
{0} · selected color|{0} · выбранный цвет|{0} · couleur sélectionnée|{0} · ausgewählte Farbe|{0} · colore selezionato|{0} · color seleccionado
{0} hue|{0}: цветовой тон|{0} : teinte|{0}: Farbton|{0}: tonalità|{0}: tono
{0} color amount|{0}: интенсивность цвета|{0} : intensité de couleur|{0}: Farbintensität|{0}: intensità colore|{0}: intensidad de color
Midtones|Средние тона|Tons moyens|Mitteltöne|Mezzitoni|Tonos medios
Black point|Точка чёрного|Point noir|Schwarzpunkt|Punto di nero|Punto negro
Lower midtones|Тёмные средние тона|Tons moyens sombres|Dunkle Mitteltöne|Mezzitoni scuri|Tonos medios oscuros
Upper midtones|Светлые средние тона|Tons moyens clairs|Helle Mitteltöne|Mezzitoni chiari|Tonos medios claros
White point|Точка белого|Point blanc|Weißpunkt|Punto di bianco|Punto blanco
Reset global adjustments|Сбросить общие настройки|Réinitialiser les réglages globaux|Globale Anpassungen zurücksetzen|Ripristina regolazioni globali|Restablecer ajustes globales
Start with the light. Every slider is live, and every edit is reversible.|Начните со света. Каждый ползунок действует сразу, а любую правку можно отменить.|Commencez par la lumière. Chaque curseur agit en direct et chaque retouche est réversible.|Beginne mit dem Licht. Jeder Regler wirkt sofort, jede Änderung ist umkehrbar.|Inizia dalla luce. Ogni cursore agisce subito e ogni modifica è reversibile.|Empieza por la luz. Cada deslizador actúa al instante y cada edición es reversible.
Change one color family without changing the others.|Изменяйте одну группу цветов, не затрагивая остальные.|Modifiez une famille de couleurs sans toucher aux autres.|Ändere eine Farbfamilie, ohne die anderen zu verändern.|Modifica una famiglia di colori senza cambiare le altre.|Cambia una familia de colores sin alterar las demás.
Inspect at 100% for fine detail. Noise smoothing is a light luminance filter.|Проверяйте детали при 100%. Сглаживание шума — мягкий фильтр яркости.|Examinez les détails à 100 %. Le lissage du bruit est un léger filtre de luminance.|Prüfe feine Details bei 100 %. Die Rauschglättung ist ein sanfter Luminanzfilter.|Controlla i dettagli al 100%. La riduzione del rumore è un filtro leggero di luminanza.|Examina los detalles al 100 %. El suavizado de ruido es un filtro suave de luminancia.
Switch to Advanced for the Color Mixer, Color Grading, Effects, Detail and Tone Curve.|Переключитесь в расширенный режим для смешения цветов, тонирования, эффектов, деталей и кривой.|Passez en mode Avancé pour le mélangeur, l’étalonnage, les effets, le détail et la courbe.|Wechsle zu Erweitert für Farbmischer, Color Grading, Effekte, Details und Gradationskurve.|Passa ad Avanzato per mixer colori, color grading, effetti, dettagli e curva tonale.|Cambia a Avanzado para el mezclador, gradación, efectos, detalle y curva de tonos.
Drag a rectangle on the image. Crop first, then rotate and flip. Your original stays untouched.|Нарисуйте прямоугольник на фото. Сначала кадрируйте, затем поворачивайте и отражайте. Оригинал не меняется.|Tracez un rectangle sur l’image. Recadrez, puis tournez et retournez. L’original reste intact.|Ziehe ein Rechteck im Bild auf. Erst zuschneiden, dann drehen und spiegeln. Das Original bleibt unverändert.|Traccia un rettangolo sull’immagine. Ritaglia, poi ruota e rifletti. L’originale resta intatto.|Dibuja un rectángulo en la imagen. Recorta, luego gira y voltea. El original permanece intacto.
Edit crop & geometry|Изменить кадрирование и геометрию|Modifier le recadrage et la géométrie|Zuschnitt und Geometrie bearbeiten|Modifica ritaglio e geometria|Editar recorte y geometría
Aspect ratio|Соотношение сторон|Rapport largeur/hauteur|Seitenverhältnis|Proporzioni|Relación de aspecto
Freeform|Свободное|Libre|Frei|Libero|Libre
Original|Оригинал|Original|Original|Originale|Original
Square · 1:1|Квадрат · 1:1|Carré · 1:1|Quadrat · 1:1|Quadrato · 1:1|Cuadrado · 1:1
Landscape · 3:2|Альбомное · 3:2|Paysage · 3:2|Querformat · 3:2|Orizzontale · 3:2|Horizontal · 3:2
Landscape · 4:3|Альбомное · 4:3|Paysage · 4:3|Querformat · 4:3|Orizzontale · 4:3|Horizontal · 4:3
Wide · 16:9|Широкое · 16:9|Large · 16:9|Breitbild · 16:9|Panoramico · 16:9|Panorámico · 16:9
Portrait · 4:5|Портретное · 4:5|Portrait · 4:5|Hochformat · 4:5|Verticale · 4:5|Vertical · 4:5
Portrait · 2:3|Портретное · 2:3|Portrait · 2:3|Hochformat · 2:3|Verticale · 2:3|Vertical · 2:3
Rotate|Поворот|Rotation|Drehen|Ruota|Girar
Straighten|Выравнивание|Redressement|Begradigen|Raddrizza|Enderezar
Flip horizontal|Отразить по горизонтали|Retourner horizontalement|Horizontal spiegeln|Rifletti orizzontalmente|Voltear horizontalmente
Flip vertical|Отразить по вертикали|Retourner verticalement|Vertikal spiegeln|Rifletti verticalmente|Voltear verticalmente
width|ширина|largeur|Breite|larghezza|ancho
height|высота|hauteur|Höhe|altezza|alto
Crop {0} percent|Кадрирование: {0}, проценты|Recadrage : {0} en pourcentage|Zuschnitt: {0} in Prozent|Ritaglio: {0} in percentuale|Recorte: {0} en porcentaje
Rotation and straightening are applied on Done. PNG keeps transparent corners; JPEG fills them white.|Поворот и выравнивание применяются кнопкой «Готово». PNG сохраняет прозрачные углы; JPEG заполняет их белым.|La rotation et le redressement s’appliquent avec Terminé. PNG garde les coins transparents ; JPEG les remplit de blanc.|Drehung und Begradigung werden mit Fertig angewendet. PNG behält transparente Ecken, JPEG füllt sie weiß.|Rotazione e raddrizzamento si applicano con Fatto. PNG mantiene gli angoli trasparenti; JPEG li riempie di bianco.|El giro y enderezado se aplican con Listo. PNG mantiene las esquinas transparentes; JPEG las rellena de blanco.
Done · apply geometry|Готово · применить геометрию|Terminé · appliquer la géométrie|Fertig · Geometrie anwenden|Fatto · applica geometria|Listo · aplicar geometría
Reset crop & rotation|Сбросить кадрирование и поворот|Réinitialiser recadrage et rotation|Zuschnitt und Drehung zurücksetzen|Ripristina ritaglio e rotazione|Restablecer recorte y giro
Cancel changes|Отменить изменения|Annuler les modifications|Änderungen verwerfen|Annulla modifiche|Cancelar cambios
Remove reference|Удалить образец|Retirer la référence|Referenz entfernen|Rimuovi riferimento|Quitar referencia
Reference luminance histogram|Гистограмма яркости образца|Histogramme de luminance de référence|Luminanzhistogramm der Referenz|Istogramma di luminanza del riferimento|Histograma de luminancia de referencia
Color transfer strength|Сила переноса цвета|Intensité du transfert de couleur|Stärke der Farbübertragung|Intensità trasferimento colore|Intensidad de transferencia de color
Matching method|Метод сопоставления|Méthode de correspondance|Abgleichmethode|Metodo di corrispondenza|Método de correspondencia
Perceptual · gentle tonal matching|Перцептивный · мягкий тональный перенос|Perceptuel · correspondance tonale douce|Perzeptuell · sanfter Tonwertabgleich|Percettivo · corrispondenza tonale delicata|Perceptivo · correspondencia tonal suave
Classic · original Lab transfer|Классический · перенос Lab|Classique · transfert Lab original|Klassisch · ursprüngliche Lab-Übertragung|Classico · trasferimento Lab originale|Clásico · transferencia Lab original
Tone match strength|Сила переноса тонов|Intensité de correspondance tonale|Stärke des Tonwertabgleichs|Intensità corrispondenza tonale|Intensidad de correspondencia tonal
Preserve skin tones|Сохранение оттенков кожи|Préserver les tons chair|Hauttöne schützen|Preserva toni della pelle|Preservar tonos de piel
Skin protection mask|Маска защиты кожи|Masque de protection de la peau|Hautschutzmaske|Maschera di protezione pelle|Máscara de protección de piel
Choose a skin mask|Выберите маску кожи|Choisir un masque de peau|Hautmaske wählen|Scegli maschera pelle|Elegir máscara de piel
 (disabled)| (отключено)| (désactivé)| (deaktiviert)| (disattivata)| (desactivada)
Skin protection|Защита кожи|Protection de la peau|Hautschutz|Protezione pelle|Protección de piel
Advanced matching settings|Расширенные настройки переноса|Réglages avancés de correspondance|Erweiterte Abgleicheinstellungen|Impostazioni avanzate di corrispondenza|Ajustes avanzados de correspondencia
Chroma match strength|Сила переноса цветности|Intensité de correspondance chromatique|Stärke des Farbabgleichs|Intensità corrispondenza cromatica|Intensidad de correspondencia cromática
Borrow a color atmosphere, while keeping your photograph’s character. Color and tone matching, not scene relighting.|Перенесите цветовую атмосферу, сохранив характер фотографии. Сопоставляются цвета и тона, а не освещение сцены.|Empruntez une ambiance tout en gardant le caractère de votre photo. Correspondance de couleurs et de tons, sans rééclairage.|Übernimm eine Farbstimmung und bewahre den Charakter deines Fotos. Farb- und Tonwertabgleich, keine neue Beleuchtung.|Riprendi un’atmosfera cromatica mantenendo il carattere della foto. Corrispondenza di colori e toni, senza cambiare la luce della scena.|Adopta una atmósfera de color conservando el carácter de tu foto. Se ajustan colores y tonos, no la iluminación de la escena.
Create a Skin mask in AI Tools first. Inspect and correct it with Brush; only its selected area is protected from Color DNA.|Сначала создайте маску кожи в ИИ-инструментах. Проверьте и исправьте её кистью; только выделенная область защищена от ДНК цвета.|Créez d’abord un masque de peau dans Outils IA. Vérifiez et corrigez au pinceau ; seule la sélection est protégée de l’ADN couleur.|Erstelle zuerst eine Hautmaske unter KI-Werkzeuge. Prüfe und korrigiere sie mit dem Pinsel; nur die Auswahl ist vor Farb-DNA geschützt.|Crea prima una maschera pelle in Strumenti IA. Controlla e correggi col pennello; solo l’area selezionata è protetta dal DNA del colore.|Crea primero una máscara de piel en Herramientas IA. Revísala y corrígela con el pincel; solo el área seleccionada se protege del ADN de color.
Classic mode retains the original Lab mean/variance transfer for compatible presets.|Классический режим сохраняет исходный перенос среднего и дисперсии Lab для совместимости пресетов.|Le mode Classique conserve le transfert Lab moyenne/variance original pour les préréglages compatibles.|Der klassische Modus behält die ursprüngliche Lab-Mittelwert-/Varianzübertragung für kompatible Vorgaben.|La modalità Classica mantiene il trasferimento Lab originale di media/varianza per predefiniti compatibili.|El modo Clásico mantiene la transferencia Lab original de media/varianza para preajustes compatibles.
Perceptual matching anchors black and white, limits luminance shifts, and tempers extreme chroma. Reference statistics stay fixed for consistent export and LUTs.|Перцептивный перенос фиксирует чёрный и белый, ограничивает сдвиги яркости и чрезмерную цветность. Статистика образца остаётся постоянной для экспорта и LUT.|La correspondance perceptuelle fixe le noir et le blanc, limite les écarts de luminance et modère les couleurs extrêmes. Les statistiques de référence restent fixes pour l’export et les LUT.|Der perzeptuelle Abgleich verankert Schwarz und Weiß, begrenzt Luminanzverschiebungen und extreme Farbigkeit. Referenzstatistiken bleiben für Export und LUTs konstant.|La corrispondenza percettiva fissa bianco e nero, limita gli scostamenti di luminanza e modera la cromaticità estrema. Le statistiche restano fisse per esportazioni e LUT coerenti.|La correspondencia perceptiva fija blanco y negro, limita cambios de luminancia y modera colores extremos. Las estadísticas de referencia permanecen fijas para exportaciones y LUT coherentes.
Mode|Режим|Mode|Modus|Modalità|Modo
Fast 2x - Bicubic|Быстрое 2× — бикубическое|Rapide 2× — bicubique|Schnell 2× – bikubisch|Rapido 2× — bicubico|Rápido 2× — bicúbico
AI 2x - Swin2SR (experimental)|ИИ 2× — Swin2SR (экспериментально)|IA 2× — Swin2SR (expérimental)|KI 2× – Swin2SR (experimentell)|IA 2× — Swin2SR (sperimentale)|IA 2× — Swin2SR (experimental)
Output resolution:|Выходное разрешение:|Résolution de sortie :|Ausgabeauflösung:|Risoluzione di uscita:|Resolución de salida:
Choose a photo|Выберите фото|Choisissez une photo|Foto auswählen|Scegli una foto|Elige una foto
{0} x {1} pixels|{0} × {1} пикселей|{0} × {1} pixels|{0} × {1} Pixel|{0} × {1} pixel|{0} × {1} píxeles
Applied|Применено|Appliqué|Angewendet|Applicato|Aplicado
Apply 2x|Применить 2×|Appliquer 2×|2× anwenden|Applica 2×|Aplicar 2×
CPU resampling|Ресэмплинг на ЦП|Rééchantillonnage CPU|CPU-Neuberechnung|Ricampionamento CPU|Remuestreo CPU
Selecting backend|Выбор вычислителя|Sélection du moteur|Backend wird gewählt|Selezione backend|Seleccionando motor
/ Warm session|/ Прогретый сеанс|/ Session à chaud|/ Warme Sitzung|/ Sessione a caldo|/ Sesión en caliente
Loading model / processing|Загрузка модели / обработка|Chargement du modèle / traitement|Modell laden / verarbeiten|Caricamento modello / elaborazione|Cargando modelo / procesando
Processing|Обработка|Traitement|Verarbeitung|Elaborazione|Procesando
Cancel|Отмена|Annuler|Abbrechen|Annulla|Cancelar
Applied in the workspace. Export uses this exact result. Undo restores the original resolution. New edits require Apply again.|Применено в рабочей области. Экспорт использует этот результат. Отмена возвращает исходное разрешение. После новых правок примените снова.|Appliqué dans l’espace de travail. L’export utilise ce résultat. Annuler restaure la résolution initiale. Après de nouvelles retouches, appliquez à nouveau.|Im Arbeitsbereich angewendet. Der Export nutzt dieses Ergebnis. Rückgängig stellt die Originalauflösung wieder her. Nach weiteren Änderungen erneut anwenden.|Applicato nell’area di lavoro. L’esportazione usa questo risultato. Annulla ripristina la risoluzione originale. Dopo nuove modifiche, applica di nuovo.|Aplicado en el espacio de trabajo. La exportación usa este resultado. Deshacer restaura la resolución original. Las nuevas ediciones requieren volver a aplicar.
Model downloads on demand. AI may alter detail; inspect at 100% before exporting. Photos stay local.|Модель загружается по запросу. ИИ может менять детали; проверьте при 100% перед экспортом. Фото остаются на устройстве.|Le modèle se télécharge à la demande. L’IA peut modifier les détails ; vérifiez à 100 % avant l’export. Les photos restent locales.|Das Modell wird bei Bedarf geladen. KI kann Details verändern; vor dem Export bei 100 % prüfen. Fotos bleiben lokal.|Il modello si scarica su richiesta. L’IA può alterare i dettagli: controlla al 100% prima di esportare. Le foto restano locali.|El modelo se descarga bajo demanda. La IA puede alterar detalles; revisa al 100 % antes de exportar. Las fotos permanecen locales.
Ready. Apply processes the full edited photograph.|Готово. «Применить» обрабатывает всю отредактированную фотографию.|Prêt. Appliquer traite toute la photo retouchée.|Bereit. Anwenden verarbeitet das gesamte bearbeitete Foto.|Pronto. Applica elabora l’intera foto modificata.|Listo. Aplicar procesa la fotografía editada completa.
Known limitation: photographic testing shows distorted fine details. Fast 2x is recommended until AI quality is resolved.|Известное ограничение: тесты фотографий выявили искажения мелких деталей. Пока качество ИИ не исправлено, рекомендуется быстрое 2×.|Limite connue : les tests photo montrent des détails déformés. Le mode Rapide 2× est recommandé en attendant la correction de la qualité IA.|Bekannte Einschränkung: Fototests zeigen verzerrte feine Details. Bis zur Verbesserung der KI-Qualität wird Schnell 2× empfohlen.|Limite noto: i test fotografici mostrano dettagli fini distorti. Si consiglia Rapido 2× finché la qualità IA non sarà corretta.|Limitación conocida: las pruebas fotográficas muestran detalles finos distorsionados. Se recomienda Rápido 2× hasta resolver la calidad de IA.
Retry or choose Fast 2x.|Повторите или выберите быстрое 2×.|Réessayez ou choisissez Rapide 2×.|Erneut versuchen oder Schnell 2× wählen.|Riprova o scegli Rapido 2×.|Reintenta o elige Rápido 2×.
Done|Готово|Terminé|Fertig|Fatto|Listo
Before / After|До / После|Avant / Après|Vorher / Nachher|Prima / Dopo|Antes / Después
Before / After (B)|До / После (B)|Avant / Après (B)|Vorher / Nachher (B)|Prima / Dopo (B)|Antes / Después (B)
BEFORE|ДО|AVANT|VORHER|PRIMA|ANTES
AFTER|ПОСЛЕ|APRÈS|NACHHER|DOPO|DESPUÉS
Upscaled|Увеличенное|Agrandie|Vergrößert|Ingrandita|Ampliada
Original image|Исходное изображение|Image originale|Originalbild|Immagine originale|Imagen original
Edited image|Обработанное изображение|Image retouchée|Bearbeitetes Bild|Immagine modificata|Imagen editada
Before after divider|Разделитель до/после|Séparateur avant/après|Vorher-Nachher-Trenner|Divisore prima/dopo|Divisor antes/después
Selected mask overlay|Наложение выбранной маски|Superposition du masque sélectionné|Überlagerung der ausgewählten Maske|Sovrapposizione maschera selezionata|Superposición de máscara seleccionada
Lumerix aperture|Диафрагма Lumerix|Diaphragme Lumerix|Lumerix-Blende|Diaframma Lumerix|Diafragma Lumerix
YOUR LIGHT. YOUR POINT OF VIEW.|ВАШ СВЕТ. ВАШ ВЗГЛЯД.|VOTRE LUMIÈRE. VOTRE REGARD.|DEIN LICHT. DEINE SICHT.|LA TUA LUCE. IL TUO SGUARDO.|TU LUZ. TU PUNTO DE VISTA.
A little light.|Немного света.|Un peu de lumière.|Ein wenig Licht.|Un po’ di luce.|Un poco de luz.
A whole new feeling.|Совсем новое ощущение.|Une toute nouvelle émotion.|Ein ganz neues Gefühl.|Un’emozione tutta nuova.|Una sensación totalmente nueva.
Shape the colors. Find your look.|Меняйте цвета. Найдите свой стиль.|Façonnez les couleurs. Trouvez votre style.|Gestalte die Farben. Finde deinen Look.|Modella i colori. Trova il tuo stile.|Moldea los colores. Encuentra tu estilo.
A private photo studio, right on your device.|Личная фотостудия на вашем устройстве.|Un studio photo privé sur votre appareil.|Dein privates Fotostudio direkt auf deinem Gerät.|Uno studio fotografico privato sul tuo dispositivo.|Un estudio fotográfico privado en tu dispositivo.
Open a photograph|Открыть фотографию|Ouvrir une photo|Foto öffnen|Apri una foto|Abrir una fotografía
JPEG, PNG, WebP · Nothing is uploaded|JPEG, PNG, WebP · Без отправки файлов|JPEG, PNG, WebP · Aucun envoi|JPEG, PNG, WebP · Kein Upload|JPEG, PNG, WebP · Nessun caricamento|JPEG, PNG, WebP · Sin subir archivos
Developing preview…|Обработка предпросмотра…|Développement de l’aperçu…|Vorschau wird entwickelt…|Elaborazione anteprima…|Procesando vista previa…
{0} × {1} original pixels|{0} × {1} исходных пикселей|{0} × {1} pixels d’origine|{0} × {1} Originalpixel|{0} × {1} pixel originali|{0} × {1} píxeles originales
Tip: open a photo, then start with Light in Edit.|Совет: откройте фото и начните со «Света» в «Правке».|Conseil : ouvrez une photo, puis commencez par Lumière dans Retouche.|Tipp: Öffne ein Foto und beginne mit Licht unter Bearbeiten.|Suggerimento: apri una foto e inizia da Luce in Modifica.|Consejo: abre una foto y empieza por Luz en Editar.
Zoom out|Уменьшить|Dézoomer|Verkleinern|Riduci zoom|Alejar
Zoom in|Увеличить|Zoomer|Vergrößern|Aumenta zoom|Acercar
Fit image (F)|Вписать изображение (F)|Ajuster l’image (F)|Bild einpassen (F)|Adatta immagine (F)|Ajustar imagen (F)
100% pixel view|Просмотр пикселей 100%|Affichage à 100 %|Pixelansicht 100 %|Vista pixel 100%|Vista de píxeles al 100 %
200% pixel view|Просмотр пикселей 200%|Affichage à 200 %|Pixelansicht 200 %|Vista pixel 200%|Vista de píxeles al 200 %
LOADED|ЗАГРУЖЕНО|CHARGÉE|GELADEN|CARICATA|CARGADA
Replace image|Заменить изображение|Remplacer l’image|Bild ersetzen|Sostituisci immagine|Reemplazar imagen
Replace|Заменить|Remplacer|Ersetzen|Sostituisci|Reemplazar
Remove|Удалить|Retirer|Entfernen|Rimuovi|Quitar
Choose Photo|Выбрать фото|Choisir une photo|Foto wählen|Scegli foto|Elegir foto
Choose Reference|Выбрать образец|Choisir une référence|Referenz wählen|Scegli riferimento|Elegir referencia
Drop your {0} here|Перетащите {0} сюда|Déposez votre {0} ici|{0} hier ablegen|Trascina {0} qui|Arrastra {0} aquí
or click to browse|или нажмите для выбора|ou cliquez pour parcourir|oder klicken zum Durchsuchen|o fai clic per sfogliare|o haz clic para explorar
Decoding…|Декодирование…|Décodage…|Dekodieren…|Decodifica…|Decodificando…
Reading image...|Чтение изображения…|Lecture de l’image…|Bild wird gelesen…|Lettura immagine…|Leyendo imagen…
JPG, PNG, WebP · up to 80 MB|JPG, PNG, WebP · до 80 МБ|JPG, PNG, WebP · jusqu’à 80 Mo|JPG, PNG, WebP · bis 80 MB|JPG, PNG, WebP · fino a 80 MB|JPG, PNG, WebP · hasta 80 MB
Upload {0} image|Загрузить: {0}|Charger l’image {0}|Bild laden: {0}|Carica immagine: {0}|Cargar imagen: {0}
Replace {0} image|Заменить: {0}|Remplacer l’image {0}|Bild ersetzen: {0}|Sostituisci immagine: {0}|Reemplazar imagen: {0}
Remove {0} image|Удалить: {0}|Retirer l’image {0}|Bild entfernen: {0}|Rimuovi immagine: {0}|Quitar imagen: {0}
{0} thumbnail|Миниатюра: {0}|Miniature : {0}|Vorschaubild: {0}|Miniatura: {0}|Miniatura: {0}
Editing panel: {0}. Swipe up or down, or use arrow keys to resize.|Панель правки: {0}. Проведите вверх или вниз либо используйте стрелки для изменения размера.|Panneau de retouche : {0}. Balayez vers le haut ou le bas, ou utilisez les flèches pour redimensionner.|Bearbeitungsbereich: {0}. Zum Ändern der Größe hoch oder runter wischen oder Pfeiltasten nutzen.|Pannello modifica: {0}. Scorri su o giù o usa le frecce per ridimensionare.|Panel de edición: {0}. Desliza arriba o abajo o usa las flechas para cambiar el tamaño.
collapsed|свёрнута|réduit|eingeklappt|compresso|contraído
normal|обычная|normal|normal|normale|normal
expanded|развёрнута|développé|erweitert|espanso|expandido
The operation failed. Please try again. Technical details:|Операция не удалась. Повторите попытку. Технические сведения:|L’opération a échoué. Réessayez. Détails techniques :|Der Vorgang ist fehlgeschlagen. Bitte erneut versuchen. Technische Details:|Operazione non riuscita. Riprova. Dettagli tecnici:|La operación falló. Inténtalo de nuevo. Detalles técnicos:
`;
const more = `
TAKE YOUR VISION WITH YOU|СОХРАНИТЕ СВОЁ ВИДЕНИЕ|EMPORTEZ VOTRE VISION|NIMM DEINE VISION MIT|PORTA CON TE LA TUA VISIONE|LLEVA TU VISIÓN CONTIGO
LUT Studio|LUT-студия|Studio LUT|LUT-Studio|Studio LUT|Estudio LUT
Export photograph|Экспорт фотографии|Exporter la photo|Foto exportieren|Esporta foto|Exportar fotografía
Close export|Закрыть экспорт|Fermer l’export|Export schließen|Chiudi esportazione|Cerrar exportación
Photograph|Фотография|Photographie|Foto|Fotografia|Fotografía
3D LUT · .cube|3D LUT · .cube|LUT 3D · .cube|3D-LUT · .cube|LUT 3D · .cube|LUT 3D · .cube
pixels · Original-resolution processing with all global, local and geometry edits.|пикселей · Обработка в исходном разрешении со всеми общими, локальными и геометрическими правками.|pixels · Traitement en résolution d’origine avec tous les réglages globaux, locaux et géométriques.|Pixel · Verarbeitung in Originalauflösung mit allen globalen, lokalen und geometrischen Änderungen.|pixel · Elaborazione alla risoluzione originale con tutte le modifiche globali, locali e geometriche.|píxeles · Procesamiento a resolución original con todos los ajustes globales, locales y geométricos.
Exports the applied 2x result shown in the workspace. No additional model inference. Upscaling is excluded from LUT files.|Экспортируется применённый результат 2× из рабочей области без повторного запуска модели. Увеличение не входит в LUT.|Exporte le résultat 2× appliqué dans l’espace de travail, sans nouvelle inférence. L’agrandissement est exclu des LUT.|Exportiert das angewendete 2×-Ergebnis aus dem Arbeitsbereich ohne erneute Inferenz. Die Vergrößerung ist nicht in LUT-Dateien enthalten.|Esporta il risultato 2× applicato nell’area di lavoro, senza ulteriore inferenza. L’ingrandimento è escluso dai file LUT.|Exporta el resultado 2× aplicado en el espacio de trabajo, sin inferencia adicional. La ampliación se excluye de los archivos LUT.
File format|Формат файла|Format du fichier|Dateiformat|Formato file|Formato de archivo
JPEG quality|Качество JPEG|Qualité JPEG|JPEG-Qualität|Qualità JPEG|Calidad JPEG
Transparent regions and rotated corners are filled with white.|Прозрачные области и углы после поворота заполняются белым.|Les zones transparentes et les coins après rotation sont remplis de blanc.|Transparente Bereiche und gedrehte Ecken werden weiß gefüllt.|Le aree trasparenti e gli angoli ruotati vengono riempiti di bianco.|Las áreas transparentes y las esquinas giradas se rellenan de blanco.
Export image|Экспорт изображения|Exporter l’image|Bild exportieren|Esporta immagine|Exportar imagen
Encoding image…|Кодирование изображения…|Encodage de l’image…|Bild wird kodiert…|Codifica immagine…|Codificando imagen…
Processing {0}%|Обработка {0}%|Traitement {0} %|Verarbeitung {0} %|Elaborazione {0}%|Procesando {0} %
Cancel export|Отменить экспорт|Annuler l’export|Export abbrechen|Annulla esportazione|Cancelar exportación
LUT name|Название LUT|Nom de la LUT|LUT-Name|Nome LUT|Nombre de LUT
Grid size|Размер сетки|Taille de la grille|Gittergröße|Dimensione griglia|Tamaño de cuadrícula
17 × 17 × 17 · compact|17 × 17 × 17 · компактная|17 × 17 × 17 · compacte|17 × 17 × 17 · kompakt|17 × 17 × 17 · compatta|17 × 17 × 17 · compacta
33 × 33 × 33 · recommended|33 × 33 × 33 · рекомендуется|33 × 33 × 33 · recommandée|33 × 33 × 33 · empfohlen|33 × 33 × 33 · consigliata|33 × 33 × 33 · recomendada
65 × 65 × 65 · fine|65 × 65 × 65 · точная|65 × 65 × 65 · fine|65 × 65 × 65 · fein|65 × 65 × 65 · fine|65 × 65 × 65 · fina
Preview of exported LUT applied to original photo|Предпросмотр экспортируемой LUT на исходном фото|Aperçu de la LUT exportée sur la photo originale|Vorschau der exportierten LUT auf dem Originalfoto|Anteprima LUT esportata applicata alla foto originale|Vista previa de LUT exportada aplicada a la foto original
Actual interpolated LUT preview · original framing · global effects only. Strong curves and color selections can need a finer grid.|Предпросмотр интерполированной LUT · исходный кадр · только общие эффекты. Сильные кривые и цветовые выделения могут требовать более точной сетки.|Aperçu réel de la LUT interpolée · cadrage original · effets globaux uniquement. Les courbes fortes et sélections de couleurs peuvent nécessiter une grille plus fine.|Tatsächliche interpolierte LUT-Vorschau · Originalausschnitt · nur globale Effekte. Starke Kurven und Farbauswahlen können ein feineres Gitter erfordern.|Anteprima reale della LUT interpolata · inquadratura originale · solo effetti globali. Curve forti e selezioni di colore possono richiedere una griglia più fine.|Vista previa real de LUT interpolada · encuadre original · solo efectos globales. Las curvas fuertes y selecciones de color pueden necesitar una cuadrícula más fina.
Included global transformations|Включённые общие преобразования|Transformations globales incluses|Enthaltene globale Transformationen|Trasformazioni globali incluse|Transformaciones globales incluidas
Excluded from this LUT|Не входит в эту LUT|Exclus de cette LUT|Nicht in dieser LUT enthalten|Esclusi da questa LUT|Excluido de esta LUT
Exposure, contrast, shadows, highlights, temperature, tint, saturation|Экспозиция, контраст, тени, светлые тона, температура, оттенок, насыщенность|Exposition, contraste, ombres, hautes lumières, température, teinte, saturation|Belichtung, Kontrast, Tiefen, Lichter, Temperatur, Tönung, Sättigung|Esposizione, contrasto, ombre, alte luci, temperatura, tinta, saturazione|Exposición, contraste, sombras, iluminaciones, temperatura, matiz, saturación
HSL Color Mixer, RGB tone curve, three-way color grading|Смешение цветов HSL, кривая RGB, трёхполосное тонирование|Mélangeur HSL, courbe RVB, étalonnage à trois voies|HSL-Farbmischer, RGB-Gradationskurve, Dreiwege-Color-Grading|Mixer HSL, curva RGB, color grading a tre vie|Mezclador HSL, curva RGB, gradación de color de tres vías
Color DNA (frozen source/reference statistics), palette mapping, look strength|ДНК цвета (фиксированная статистика исходника и образца), палитра, сила стиля|ADN couleur (statistiques source/référence fixes), palette, intensité du style|Farb-DNA (feste Quell-/Referenzstatistiken), Palettenzuordnung, Look-Stärke|DNA del colore (statistiche sorgente/riferimento fisse), palette, intensità stile|ADN de color (estadísticas de origen/referencia fijas), paleta, intensidad de estilo
Crop, rotation, flips, straighten|Кадрирование, поворот, отражение, выравнивание|Recadrage, rotation, retournements, redressement|Zuschnitt, Drehung, Spiegelung, Begradigung|Ritaglio, rotazione, riflessi, raddrizzamento|Recorte, giro, volteos, enderezado
Masks, local adjustments and mask-based skin protection|Маски, локальная коррекция и защита кожи по маске|Masques, réglages locaux et protection de la peau par masque|Masken, lokale Anpassungen und maskenbasierter Hautschutz|Maschere, regolazioni locali e protezione pelle tramite maschera|Máscaras, ajustes locales y protección de piel basada en máscara
Clarity, sharpening, noise reduction, grain, vignette|Чёткость, резкость, шумоподавление, зерно, виньетка|Clarté, netteté, réduction du bruit, grain, vignettage|Klarheit, Schärfung, Rauschminderung, Körnung, Vignette|Chiarezza, nitidezza, riduzione rumore, grana, vignettatura|Claridad, enfoque, reducción de ruido, grano, viñeta
Color DNA statistics are frozen from this session. This is an sRGB-to-sRGB LUT; matching on another photograph may differ.|Статистика ДНК цвета зафиксирована в этом сеансе. Это LUT sRGB→sRGB; результат на другой фотографии может отличаться.|Les statistiques ADN couleur sont figées pour cette session. Cette LUT sRGB vers sRGB peut donner un résultat différent sur une autre photo.|Die Farb-DNA-Statistiken dieser Sitzung sind fest. Diese sRGB-zu-sRGB-LUT kann auf einem anderen Foto anders wirken.|Le statistiche DNA del colore sono fisse per questa sessione. Questa LUT sRGB-sRGB può dare risultati diversi su altre foto.|Las estadísticas de ADN de color se fijan en esta sesión. Esta LUT sRGB a sRGB puede dar resultados distintos en otra foto.
Building LUT & preview…|Создание LUT и предпросмотра…|Création de la LUT et de l’aperçu…|LUT und Vorschau werden erstellt…|Creazione LUT e anteprima…|Creando LUT y vista previa…
Export .cube LUT|Экспорт LUT .cube|Exporter la LUT .cube|.cube-LUT exportieren|Esporta LUT .cube|Exportar LUT .cube
Your images are processed locally. No upload.|Изображения обрабатываются локально. Без отправки файлов.|Vos images sont traitées localement. Aucun envoi.|Deine Bilder werden lokal verarbeitet. Kein Upload.|Le immagini sono elaborate localmente. Nessun caricamento.|Tus imágenes se procesan localmente. Sin subir archivos.
Global look preview|Предпросмотр общего стиля|Aperçu du style global|Vorschau des globalen Looks|Anteprima stile globale|Vista previa de estilo global
Add a photo to preview|Добавьте фото для предпросмотра|Ajoutez une photo pour l’aperçu|Foto für Vorschau hinzufügen|Aggiungi foto per l’anteprima|Añade una foto para previsualizar
Presets save parameters. Palettes guide color. LUTs carry a global color transform to other apps.|Пресеты сохраняют параметры. Палитры задают цвета. LUT переносят общее цветовое преобразование в другие приложения.|Les préréglages enregistrent les paramètres, les palettes orientent les couleurs et les LUT transfèrent une transformation globale vers d’autres apps.|Vorgaben speichern Parameter. Paletten bestimmen Farben. LUTs übertragen globale Farbtransformationen in andere Apps.|I predefiniti salvano i parametri, le palette guidano il colore e le LUT trasferiscono trasformazioni globali ad altre app.|Los preajustes guardan parámetros, las paletas guían el color y las LUT llevan una transformación global a otras apps.
Look strength|Сила стиля|Intensité du style|Look-Stärke|Intensità stile|Intensidad de estilo
Favorites only|Только избранное|Favoris uniquement|Nur Favoriten|Solo preferiti|Solo favoritos
Studio looks|Студийные стили|Styles du studio|Studio-Looks|Stili studio|Estilos del estudio
Clean daylight|Чистый дневной свет|Lumière du jour pure|Klares Tageslicht|Luce diurna pulita|Luz diurna limpia
Soft cinema|Мягкое кино|Cinéma doux|Sanftes Kino|Cinema morbido|Cine suave
Amber hour|Янтарный час|Heure ambrée|Bernsteinstunde|Ora ambrata|Hora ámbar
Quiet silver|Тихое серебро|Argent paisible|Stilles Silber|Argento quieto|Plata tranquila
Coastal air|Морской воздух|Air côtier|Küstenluft|Aria costiera|Aire costero
Faded print|Выцветший отпечаток|Tirage délavé|Verblasster Abzug|Stampa sbiadita|Copia desvaída
Desert light|Свет пустыни|Lumière du désert|Wüstenlicht|Luce del deserto|Luz del desierto
Nordic coast|Северный берег|Côte nordique|Nordische Küste|Costa nordica|Costa nórdica
Rose garden|Розовый сад|Roseraie|Rosengarten|Giardino di rose|Jardín de rosas
Your presets|Ваши пресеты|Vos préréglages|Deine Vorgaben|I tuoi predefiniti|Tus preajustes
Preset name|Название пресета|Nom du préréglage|Name der Vorgabe|Nome predefinito|Nombre del preajuste
Name this look…|Название стиля…|Nommez ce style…|Look benennen…|Dai un nome allo stile…|Nombra este estilo…
Save|Сохранить|Enregistrer|Speichern|Salva|Guardar
Saves global settings, without masks or geometry. Color DNA needs a reference in each session.|Сохраняет общие настройки без масок и геометрии. Для ДНК цвета нужен образец в каждом сеансе.|Enregistre les réglages globaux, sans masques ni géométrie. L’ADN couleur nécessite une référence à chaque session.|Speichert globale Einstellungen ohne Masken oder Geometrie. Farb-DNA benötigt in jeder Sitzung eine Referenz.|Salva le impostazioni globali senza maschere o geometria. Il DNA del colore richiede un riferimento per ogni sessione.|Guarda ajustes globales sin máscaras ni geometría. El ADN de color necesita una referencia en cada sesión.
Palette library|Библиотека палитр|Bibliothèque de palettes|Palettenbibliothek|Libreria palette|Biblioteca de paletas
Palette influence|Влияние палитры|Influence de la palette|Paletteneinfluss|Influenza palette|Influencia de paleta
Create a palette|Создать палитру|Créer une palette|Palette erstellen|Crea una palette|Crear una paleta
Palette name…|Название палитры…|Nom de la palette…|Palettenname…|Nome palette…|Nombre de paleta…
Palette name|Название палитры|Nom de la palette|Palettenname|Nome palette|Nombre de paleta
Palette color {0}|Цвет палитры {0}|Couleur de palette {0}|Palettenfarbe {0}|Colore palette {0}|Color de paleta {0}
Apply these colors|Применить эти цвета|Appliquer ces couleurs|Diese Farben anwenden|Applica questi colori|Aplicar estos colores
Open LUT Studio|Открыть LUT-студию|Ouvrir le studio LUT|LUT-Studio öffnen|Apri studio LUT|Abrir estudio LUT
Apply {0}|Применить: {0}|Appliquer : {0}|Anwenden: {0}|Applica: {0}|Aplicar: {0}
Favorite {0}|В избранное: {0}|Favori : {0}|Favorit: {0}|Preferito: {0}|Favorito: {0}
Rename {0}|Переименовать: {0}|Renommer : {0}|Umbenennen: {0}|Rinomina: {0}|Renombrar: {0}
Delete {0}|Удалить: {0}|Supprimer : {0}|Löschen: {0}|Elimina: {0}|Eliminar: {0}
Make a selection, then adjust only that area. Masks remain editable after Done.|Выделите область, затем изменяйте только её. Маски можно редактировать и после «Готово».|Sélectionnez une zone, puis réglez uniquement celle-ci. Les masques restent modifiables après Terminé.|Wähle einen Bereich und passe nur diesen an. Masken bleiben nach Fertig bearbeitbar.|Seleziona un’area e regola solo quella. Le maschere restano modificabili dopo Fatto.|Selecciona un área y ajusta solo esa zona. Las máscaras siguen siendo editables después de Listo.
On-device AI · one-time downloads|ИИ на устройстве · однократная загрузка|IA sur l’appareil · téléchargements uniques|KI auf dem Gerät · einmalige Downloads|IA sul dispositivo · download una tantum|IA en el dispositivo · descargas únicas
Sky / objects: about 15 MB model, plus up to 30 MB runtime. Person / skin: about 16 MB plus runtime. Downloaded assets are cached for offline reuse; storage eviction may require downloading again. Photos never leave this device.|Небо / объекты: модель около 15 МБ и среда до 30 МБ. Человек / кожа: около 16 МБ и среда. Файлы кэшируются для автономной работы; после очистки хранилища потребуется повторная загрузка. Фото не покидают устройство.|Ciel / objets : modèle d’environ 15 Mo, plus jusqu’à 30 Mo de moteur. Personne / peau : environ 16 Mo plus moteur. Les fichiers sont mis en cache hors ligne ; une éviction peut nécessiter un nouveau téléchargement. Les photos restent sur l’appareil.|Himmel/Objekte: etwa 15 MB Modell plus bis zu 30 MB Laufzeit. Person/Haut: etwa 16 MB plus Laufzeit. Downloads werden offline zwischengespeichert; nach Speicherbereinigung kann ein erneuter Download nötig sein. Fotos verlassen das Gerät nie.|Cielo/oggetti: modello di circa 15 MB più runtime fino a 30 MB. Persona/pelle: circa 16 MB più runtime. I file sono in cache per uso offline; la rimozione dalla memoria può richiedere un nuovo download. Le foto non lasciano il dispositivo.|Cielo/objetos: modelo de unos 15 MB más hasta 30 MB de entorno. Persona/piel: unos 16 MB más entorno. Se guardan en caché para uso sin conexión; si se elimina la caché habrá que descargarlos de nuevo. Las fotos no salen del dispositivo.
Selection operation|Операция выделения|Opération de sélection|Auswahloperation|Operazione di selezione|Operación de selección
New mask|Новая маска|Nouveau masque|Neue Maske|Nuova maschera|Nueva máscara
Add to selected mask|Добавить к выбранной маске|Ajouter au masque sélectionné|Zur ausgewählten Maske hinzufügen|Aggiungi alla maschera selezionata|Añadir a la máscara seleccionada
Subtract from selected mask|Вычесть из выбранной маски|Soustraire du masque sélectionné|Von ausgewählter Maske abziehen|Sottrai dalla maschera selezionata|Restar de la máscara seleccionada
Select Sky|Выделить небо|Sélectionner le ciel|Himmel auswählen|Seleziona cielo|Seleccionar cielo
Select Person|Выделить человека|Sélectionner une personne|Person auswählen|Seleziona persona|Seleccionar persona
Select Skin|Выделить кожу|Sélectionner la peau|Haut auswählen|Seleziona pelle|Seleccionar piel
Select Object|Выделить объект|Sélectionner un objet|Objekt auswählen|Seleziona oggetto|Seleccionar objeto
Brush mask|Маска кистью|Masque au pinceau|Pinselmaske|Maschera pennello|Máscara con pincel
Cancel selection|Отменить выделение|Annuler la sélection|Auswahl abbrechen|Annulla selezione|Cancelar selección
Skin uses separate face/body-skin classes from a portrait model—not a person silhouette. Results work best on portraits and need review.|Для кожи используются отдельные классы лица и тела из портретной модели, а не силуэт человека. Лучше работает на портретах; проверяйте результат.|La peau utilise des classes visage/corps distinctes d’un modèle de portrait, pas une silhouette. Les résultats sont meilleurs sur les portraits et doivent être vérifiés.|Haut verwendet getrennte Gesichts-/Körperhautklassen eines Porträtmodells, keine Personensilhouette. Ergebnisse funktionieren am besten bei Porträts und müssen geprüft werden.|La pelle usa classi separate viso/corpo di un modello per ritratti, non una sagoma. I risultati migliori si ottengono sui ritratti e vanno verificati.|La piel usa clases separadas de cara/cuerpo de un modelo de retratos, no una silueta. Funciona mejor en retratos y requiere revisión.
Disable mask|Отключить маску|Désactiver le masque|Maske deaktivieren|Disattiva maschera|Desactivar máscara
Enable mask|Включить маску|Activer le masque|Maske aktivieren|Attiva maschera|Activar máscara
Duplicate mask|Дублировать маску|Dupliquer le masque|Maske duplizieren|Duplica maschera|Duplicar máscara
Delete mask|Удалить маску|Supprimer le masque|Maske löschen|Elimina maschera|Eliminar máscara
Mask name|Название маски|Nom du masque|Maskenname|Nome maschera|Nombre de máscara
Brush / Add|Кисть / добавить|Pinceau / ajouter|Pinsel / hinzufügen|Pennello / aggiungi|Pincel / añadir
Erase / Subtract|Ластик / вычесть|Gomme / soustraire|Radierer / abziehen|Gomma / sottrai|Borrar / restar
Brush size|Размер кисти|Taille du pinceau|Pinselgröße|Dimensione pennello|Tamaño del pincel
Overlay visibility|Видимость наложения|Visibilité de la superposition|Sichtbarkeit der Überlagerung|Visibilità sovrapposizione|Visibilidad de superposición
Done selecting|Завершить выделение|Terminer la sélection|Auswahl fertigstellen|Termina selezione|Terminar selección
Edit selection|Изменить выделение|Modifier la sélection|Auswahl bearbeiten|Modifica selezione|Editar selección
Selection editing shows the uncropped original coordinates. Crop and rotation return when you press Done.|При правке выделения показаны координаты исходника без кадрирования. Кадрирование и поворот вернутся после «Готово».|La sélection affiche les coordonnées originales non recadrées. Le recadrage et la rotation reviennent avec Terminé.|Beim Bearbeiten der Auswahl werden unbeschnittene Originalkoordinaten gezeigt. Zuschnitt und Drehung kehren mit Fertig zurück.|La modifica della selezione mostra le coordinate originali non ritagliate. Ritaglio e rotazione tornano premendo Fatto.|La edición de selección muestra las coordenadas originales sin recortar. El recorte y giro vuelven al pulsar Listo.
Selection edges|Края выделения|Bords de la sélection|Auswahlkanten|Bordi selezione|Bordes de selección
Feather edges|Растушёвка краёв|Contour progressif|Weiche Kanten|Sfuma bordi|Desvanecer bordes
Edge refinement|Уточнение края|Affinage des bords|Kantenverfeinerung|Rifinitura bordi|Refinamiento de bordes
Mask opacity|Непрозрачность маски|Opacité du masque|Maskendeckkraft|Opacità maschera|Opacidad de máscara
Invert selection|Инвертировать выделение|Inverser la sélection|Auswahl umkehren|Inverti selezione|Invertir selección
Local adjustments|Локальная коррекция|Réglages locaux|Lokale Anpassungen|Regolazioni locali|Ajustes locales
Preparing local AI…|Подготовка локального ИИ…|Préparation de l’IA locale…|Lokale KI wird vorbereitet…|Preparazione IA locale…|Preparando IA local…
Preparing on-device selection...|Подготовка выделения на устройстве…|Préparation de la sélection locale…|Lokale Auswahl wird vorbereitet…|Preparazione selezione locale…|Preparando selección local…
Choose a detected class. All regions of that class are selected; this model does not support click-to-select.|Выберите найденный класс. Выделяются все области этого класса; модель не поддерживает выделение щелчком.|Choisissez une classe détectée. Toutes ses zones seront sélectionnées ; ce modèle ne prend pas en charge la sélection par clic.|Wähle eine erkannte Klasse. Alle Bereiche dieser Klasse werden ausgewählt; das Modell unterstützt keine Klickauswahl.|Scegli una classe rilevata. Tutte le sue aree saranno selezionate; il modello non supporta la selezione tramite clic.|Elige una clase detectada. Se seleccionan todas sus áreas; este modelo no admite selección por clic.
Selection ready. Check edges and correct with Brush or Erase.|Выделение готово. Проверьте края и исправьте кистью или ластиком.|Sélection prête. Vérifiez les bords et corrigez au pinceau ou à la gomme.|Auswahl bereit. Kanten prüfen und mit Pinsel oder Radierer korrigieren.|Selezione pronta. Controlla i bordi e correggi con pennello o gomma.|Selección lista. Revisa los bordes y corrige con pincel o borrador.
Selection cancelled.|Выделение отменено.|Sélection annulée.|Auswahl abgebrochen.|Selezione annullata.|Selección cancelada.
No {0} was detected. Try Brush instead.|Не обнаружено: {0}. Попробуйте кисть.|Aucun élément « {0} » détecté. Essayez le pinceau.|{0} nicht erkannt. Verwende den Pinsel.|Nessun elemento «{0}» rilevato. Prova il pennello.|No se detectó «{0}». Prueba el pincel.
No matching region was detected. Use Brush to make a selection.|Подходящая область не найдена. Используйте кисть.|Aucune zone correspondante détectée. Utilisez le pinceau.|Kein passender Bereich erkannt. Verwende den Pinsel.|Nessuna area corrispondente rilevata. Usa il pennello.|No se detectó un área coincidente. Usa el pincel.
GPU unavailable. Restarting inference on CPU...|GPU недоступен. Перезапуск на ЦП…|GPU indisponible. Redémarrage sur CPU…|GPU nicht verfügbar. Neustart auf CPU…|GPU non disponibile. Riavvio su CPU…|GPU no disponible. Reiniciando en CPU…
Processing on this device...|Обработка на этом устройстве…|Traitement sur cet appareil…|Verarbeitung auf diesem Gerät…|Elaborazione sul dispositivo…|Procesando en este dispositivo…
AI selection failed. Brush remains available.|Не удалось выделить с ИИ. Кисть доступна.|Échec de la sélection IA. Le pinceau reste disponible.|KI-Auswahl fehlgeschlagen. Der Pinsel bleibt verfügbar.|Selezione IA non riuscita. Il pennello resta disponibile.|La selección IA falló. El pincel sigue disponible.
AI worker failed. Retry in a current browser with Web Worker and WebAssembly support.|Сбой ИИ-процесса. Повторите в современном браузере с поддержкой Web Worker и WebAssembly.|Échec du worker IA. Réessayez dans un navigateur récent avec Web Worker et WebAssembly.|KI-Worker fehlgeschlagen. In einem aktuellen Browser mit Web Worker und WebAssembly erneut versuchen.|Worker IA non riuscito. Riprova in un browser aggiornato con Web Worker e WebAssembly.|El worker IA falló. Reintenta en un navegador actualizado con Web Worker y WebAssembly.
AI returned unreadable data.|ИИ вернул нечитаемые данные.|L’IA a renvoyé des données illisibles.|KI lieferte unlesbare Daten.|L’IA ha restituito dati illeggibili.|La IA devolvió datos ilegibles.
Selection timed out. Retry, or use Brush. Model downloads require a connection on first use.|Время ожидания истекло. Повторите или используйте кисть. При первом запуске для загрузки модели нужен интернет.|Délai dépassé. Réessayez ou utilisez le pinceau. Le premier téléchargement du modèle nécessite une connexion.|Zeitlimit überschritten. Erneut versuchen oder Pinsel nutzen. Der erste Modelldownload erfordert eine Verbindung.|Tempo scaduto. Riprova o usa il pennello. Il primo download del modello richiede una connessione.|Tiempo agotado. Reintenta o usa el pincel. La primera descarga del modelo requiere conexión.
Local style storage is unavailable.|Локальное хранилище стилей недоступно.|Le stockage local des styles est indisponible.|Lokaler Stilspeicher ist nicht verfügbar.|Archivio locale degli stili non disponibile.|El almacenamiento local de estilos no está disponible.
Could not update local styles. Check browser storage.|Не удалось обновить стили. Проверьте хранилище браузера.|Impossible de mettre à jour les styles. Vérifiez le stockage du navigateur.|Lokale Stile konnten nicht aktualisiert werden. Browserspeicher prüfen.|Impossibile aggiornare gli stili. Controlla la memoria del browser.|No se pudieron actualizar los estilos. Revisa el almacenamiento del navegador.
Favorites could not be saved.|Не удалось сохранить избранное.|Impossible d’enregistrer les favoris.|Favoriten konnten nicht gespeichert werden.|Impossibile salvare i preferiti.|No se pudieron guardar los favoritos.
Image loading failed.|Не удалось загрузить изображение.|Échec du chargement de l’image.|Bild konnte nicht geladen werden.|Caricamento immagine non riuscito.|No se pudo cargar la imagen.
Image processing failed.|Не удалось обработать изображение.|Échec du traitement de l’image.|Bildverarbeitung fehlgeschlagen.|Elaborazione immagine non riuscita.|El procesamiento de imagen falló.
Invalid LUT dimensions.|Неверные размеры LUT.|Dimensions de LUT invalides.|Ungültige LUT-Abmessungen.|Dimensioni LUT non valide.|Dimensiones de LUT no válidas.
Edit mask|Изменить маску|Modifier le masque|Maske bearbeiten|Modifica maschera|Editar máscara
Create mask|Создать маску|Créer un masque|Maske erstellen|Crea maschera|Crear máscara
Toggle mask|Переключить маску|Activer/désactiver le masque|Maske umschalten|Attiva/disattiva maschera|Alternar máscara
Adjust mask name|Изменить название маски|Modifier le nom du masque|Maskennamen ändern|Modifica nome maschera|Cambiar nombre de máscara
Adjust mask feather|Изменить растушёвку маски|Modifier le contour progressif|Weiche Maskenkante anpassen|Regola sfumatura maschera|Ajustar desvanecido de máscara
Adjust mask edge|Изменить край маски|Modifier le bord du masque|Maskenkante anpassen|Regola bordo maschera|Ajustar borde de máscara
Adjust mask opacity|Изменить непрозрачность маски|Modifier l’opacité du masque|Maskendeckkraft anpassen|Regola opacità maschera|Ajustar opacidad de máscara
Invert mask|Инвертировать маску|Inverser le masque|Maske umkehren|Inverti maschera|Invertir máscara
Reset mask adjustments|Сбросить настройки маски|Réinitialiser les réglages du masque|Maskenanpassungen zurücksetzen|Ripristina regolazioni maschera|Restablecer ajustes de máscara
Adjust mask {0}|Настроить маску: {0}|Régler le masque : {0}|Maske anpassen: {0}|Regola maschera: {0}|Ajustar máscara: {0}
Adjust {0}|Настроить: {0}|Régler : {0}|Anpassen: {0}|Regola: {0}|Ajustar: {0}
Apply look|Применить стиль|Appliquer le style|Look anwenden|Applica stile|Aplicar estilo
Adjust style|Изменить стиль|Modifier le style|Stil anpassen|Regola stile|Ajustar estilo
Apply crop & rotation|Применить кадрирование и поворот|Appliquer recadrage et rotation|Zuschnitt und Drehung anwenden|Applica ritaglio e rotazione|Aplicar recorte y giro
Change reference|Изменить образец|Changer la référence|Referenz ändern|Cambia riferimento|Cambiar referencia
Remove reference|Удалить образец|Retirer la référence|Referenz entfernen|Rimuovi riferimento|Quitar referencia
Brush mask stroke|Мазок кисти маски|Trait de pinceau du masque|Maskenpinselstrich|Tratto pennello maschera|Trazo de pincel de máscara
Erase mask stroke|Стереть мазок маски|Effacer un trait de masque|Maskenstrich löschen|Cancella tratto maschera|Borrar trazo de máscara
Apply 2x upscale|Применить увеличение 2×|Appliquer l’agrandissement 2×|2×-Vergrößerung anwenden|Applica ingrandimento 2×|Aplicar ampliación 2×
add selection|Добавить выделение|Ajouter la sélection|Auswahl hinzufügen|Aggiungi selezione|Añadir selección
subtract selection|Вычесть выделение|Soustraire la sélection|Auswahl abziehen|Sottrai selezione|Restar selección
`;
const diagnostics = `
CROP · ORIGINAL COORDINATES|КАДРИРОВАНИЕ · ИСХОДНЫЕ КООРДИНАТЫ|RECADRAGE · COORDONNÉES ORIGINALES|ZUSCHNITT · ORIGINALKOORDINATEN|RITAGLIO · COORDINATE ORIGINALI|RECORTE · COORDENADAS ORIGINALES
MASK · ORIGINAL COORDINATES|МАСКА · ИСХОДНЫЕ КООРДИНАТЫ|MASQUE · COORDONNÉES ORIGINALES|MASKE · ORIGINALKOORDINATEN|MASCHERA · COORDINATE ORIGINALI|MÁSCARA · COORDENADAS ORIGINALES
YOUR PHOTOGRAPH|ВАША ФОТОГРАФИЯ|VOTRE PHOTO|DEIN FOTO|LA TUA FOTO|TU FOTOGRAFÍA
Choose a JPEG, PNG or WebP image.|Выберите изображение JPEG, PNG или WebP.|Choisissez une image JPEG, PNG ou WebP.|Wähle ein JPEG-, PNG- oder WebP-Bild.|Scegli un’immagine JPEG, PNG o WebP.|Elige una imagen JPEG, PNG o WebP.
This file is too large. Choose an image smaller than 80 MB.|Файл слишком большой. Выберите изображение меньше 80 МБ.|Ce fichier est trop volumineux. Choisissez une image de moins de 80 Mo.|Die Datei ist zu groß. Wähle ein Bild unter 80 MB.|File troppo grande. Scegli un’immagine inferiore a 80 MB.|El archivo es demasiado grande. Elige una imagen de menos de 80 MB.
This image could not be decoded. Try another JPEG, PNG or WebP file.|Не удалось декодировать изображение. Попробуйте другой файл JPEG, PNG или WebP.|Impossible de décoder cette image. Essayez un autre fichier JPEG, PNG ou WebP.|Dieses Bild konnte nicht dekodiert werden. Versuche eine andere JPEG-, PNG- oder WebP-Datei.|Impossibile decodificare l’immagine. Prova un altro file JPEG, PNG o WebP.|No se pudo decodificar la imagen. Prueba otro archivo JPEG, PNG o WebP.
Choose a photo under 50 megapixels for reliable editing on this device.|Для надёжной обработки выберите фото менее 50 мегапикселей.|Choisissez une photo de moins de 50 mégapixels pour une retouche fiable.|Wähle für zuverlässige Bearbeitung ein Foto unter 50 Megapixeln.|Scegli una foto sotto 50 megapixel per una modifica affidabile.|Elige una foto de menos de 50 megapíxeles para una edición fiable.
Could not create preview.|Не удалось создать предпросмотр.|Impossible de créer l’aperçu.|Vorschau konnte nicht erstellt werden.|Impossibile creare l’anteprima.|No se pudo crear la vista previa.
This browser could not start the image worker. Try a current browser with Web Worker support.|Браузер не смог запустить обработчик изображения. Используйте современный браузер с поддержкой Web Worker.|Ce navigateur n’a pas pu démarrer le worker d’image. Essayez un navigateur récent prenant en charge Web Worker.|Der Browser konnte den Bild-Worker nicht starten. Verwende einen aktuellen Browser mit Web-Worker-Unterstützung.|Il browser non ha avviato il worker immagine. Usa un browser aggiornato con supporto Web Worker.|El navegador no pudo iniciar el worker de imagen. Usa un navegador actualizado con soporte Web Worker.
Processing failed. Try a smaller image or a browser with Web Worker support.|Обработка не удалась. Попробуйте меньшее изображение или браузер с поддержкой Web Worker.|Échec du traitement. Essayez une image plus petite ou un navigateur compatible Web Worker.|Verarbeitung fehlgeschlagen. Versuche ein kleineres Bild oder einen Browser mit Web-Worker-Unterstützung.|Elaborazione non riuscita. Prova un’immagine più piccola o un browser con supporto Web Worker.|El procesamiento falló. Prueba una imagen menor o un navegador compatible con Web Worker.
2x output is limited to 32 megapixels and 16384 pixels per side. Crop the image or use a smaller source.|Результат 2× ограничен 32 мегапикселями и 16384 пикселями на сторону. Обрежьте фото или используйте меньший исходник.|La sortie 2× est limitée à 32 mégapixels et 16384 pixels par côté. Recadrez ou utilisez une source plus petite.|Die 2×-Ausgabe ist auf 32 Megapixel und 16384 Pixel pro Seite begrenzt. Bild zuschneiden oder kleinere Quelle verwenden.|L’uscita 2× è limitata a 32 megapixel e 16384 pixel per lato. Ritaglia o usa una sorgente più piccola.|La salida 2× se limita a 32 megapíxeles y 16384 píxeles por lado. Recorta o usa una fuente menor.
AI upscaling requires an opaque photograph. Use Fast for transparency.|ИИ-увеличение требует непрозрачного фото. Для прозрачности используйте быстрый режим.|L’agrandissement IA nécessite une photo opaque. Utilisez Rapide pour la transparence.|KI-Vergrößerung benötigt ein undurchsichtiges Foto. Für Transparenz Schnell verwenden.|L’ingrandimento IA richiede una foto opaca. Usa Rapido per la trasparenza.|La ampliación IA requiere una foto opaca. Usa Rápido para transparencia.
The AI model returned an unexpected 2x tile.|ИИ-модель вернула некорректный фрагмент 2×.|Le modèle IA a renvoyé une tuile 2× inattendue.|Das KI-Modell lieferte eine unerwartete 2×-Kachel.|Il modello IA ha restituito un tassello 2× inatteso.|El modelo IA devolvió un mosaico 2× inesperado.
GPU upscaling failed|Ошибка увеличения на GPU|Échec de l’agrandissement GPU|GPU-Vergrößerung fehlgeschlagen|Ingrandimento GPU non riuscito|La ampliación GPU falló
Loading semantic model ({0})...|Загрузка семантической модели ({0})…|Chargement du modèle sémantique ({0})…|Semantisches Modell wird geladen ({0})…|Caricamento modello semantico ({0})…|Cargando modelo semántico ({0})…
Downloading semantic model... {0}%|Загрузка семантической модели… {0}%|Téléchargement du modèle sémantique… {0} %|Semantisches Modell wird heruntergeladen… {0} %|Download modello semantico… {0}%|Descargando modelo semántico… {0} %
Selecting regions ({0})...|Выделение областей ({0})…|Sélection des régions ({0})…|Bereiche werden ausgewählt ({0})…|Selezione aree ({0})…|Seleccionando áreas ({0})…
Loading portrait model ({0})...|Загрузка портретной модели ({0})…|Chargement du modèle de portrait ({0})…|Porträtmodell wird geladen ({0})…|Caricamento modello ritratto ({0})…|Cargando modelo de retrato ({0})…
Finding person and skin regions ({0})...|Поиск человека и кожи ({0})…|Recherche des zones personne et peau ({0})…|Personen- und Hautbereiche werden gesucht ({0})…|Ricerca aree persona e pelle ({0})…|Buscando áreas de persona y piel ({0})…
Portrait download failed ({0})|Ошибка загрузки портретной модели ({0})|Échec du téléchargement portrait ({0})|Porträt-Download fehlgeschlagen ({0})|Download ritratto non riuscito ({0})|Descarga de retrato fallida ({0})
Portrait model returned no mask|Портретная модель не вернула маску|Le modèle de portrait n’a renvoyé aucun masque|Porträtmodell lieferte keine Maske|Il modello ritratto non ha restituito maschere|El modelo de retrato no devolvió máscara
Selection is already running|Выделение уже выполняется|Une sélection est déjà en cours|Auswahl läuft bereits|Selezione già in corso|La selección ya está en curso
Semantic selection failed|Ошибка семантического выделения|Échec de la sélection sémantique|Semantische Auswahl fehlgeschlagen|Selezione semantica non riuscita|La selección semántica falló
Portrait selection failed|Ошибка портретного выделения|Échec de la sélection portrait|Porträtauswahl fehlgeschlagen|Selezione ritratto non riuscita|La selección de retrato falló
Retry the selection or use Brush.|Повторите выделение или используйте кисть.|Réessayez la sélection ou utilisez le pinceau.|Auswahl erneut versuchen oder Pinsel nutzen.|Riprova la selezione o usa il pennello.|Reintenta la selección o usa el pincel.
Upscale|Увеличение|Agrandissement|Vergrößern|Ingrandisci|Ampliar
Super resolution|Сверхразрешение|Super-résolution|Superauflösung|Super risoluzione|Superresolución
Color Mixer|Смешение цветов|Mélangeur de couleurs|Farbmischer|Mixer colori|Mezclador de colores
Noise|Шум|Bruit|Rauschen|Rumore|Ruido
Smart Masks|Умные маски|Masques intelligents|Intelligente Masken|Maschere intelligenti|Máscaras inteligentes
Sky|Небо|Ciel|Himmel|Cielo|Cielo
Person|Человек|Personne|Person|Persona|Persona
Skin|Кожа|Peau|Haut|Pelle|Piel
Object|Объект|Objet|Objekt|Oggetto|Objeto
Brush|Кисть|Pinceau|Pinsel|Pennello|Pincel
Erase|Ластик|Gomme|Radierer|Gomma|Borrador
Match|Сопоставление|Correspondance|Abgleich|Corrispondenza|Correspondencia
Presets|Пресеты|Préréglages|Vorgaben|Predefiniti|Preajustes
Favorites|Избранное|Favoris|Favoriten|Preferiti|Favoritos
Palettes|Палитры|Palettes|Paletten|Palette|Paletas
Flip|Отразить|Retourner|Spiegeln|Rifletti|Voltear
Edit {0}|Изменить: {0}|Modifier : {0}|Bearbeiten: {0}|Modifica: {0}|Editar: {0}
Brush {0}|Кисть {0}|Pinceau {0}|Pinsel {0}|Pennello {0}|Pincel {0}
{0} copy|{0} копия|{0} copie|{0} Kopie|{0} copia|{0} copia
`;
export const messages: Record<string, readonly string[]> = { ...segmentMessages, ...Object.fromEntries([rows, more, diagnostics].flatMap(block => block.trim().split("\n")).map(row => { const [key, ...values] = row.split("|"); return [key.trim(), values]; })) };
