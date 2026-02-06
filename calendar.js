// Configuration des périodes de prix
const pricingByPeriod = {
    low: {
        label: 'Basse saison',
        price: 85,
        periods: [
            { start: '01-05', end: '06-14' },  // 5 janvier au 14 juin
            { start: '09-12', end: '10-18' },  // 12 septembre au 18 octobre
            { start: '11-03', end: '12-19' }   // 3 novembre au 19 décembre
        ]
    },
    mid: {
        label: 'Moyenne saison',
        price: 110,
        periods: [
            { start: '06-15', end: '07-03' },  // 15 juin au 3 juillet
            { start: '08-29', end: '09-11' },  // 29 août au 11 septembre
            { start: '10-19', end: '11-02' }   // 19 octobre au 2 novembre (corrigé: 17 oct -> 19 oct pour éviter chevauchement)
        ]
    },
    high: {
        label: 'Haute saison',
        price: 150,
        periods: [
            { start: '07-04', end: '08-28' }   // 4 juillet au 28 août
        ]
    },
    holiday: {
        label: 'Période de fêtes',
        price: 120,
        periods: [
            { start: '12-20', end: '01-04' }   // 20 décembre au 4 janvier (traverse l'année)
        ]
    }
};

// Variables globales
let currentDate = new Date();
let selectedStart = null;
let selectedEnd = null;
let bookedDates = [];

// Fonction pour charger les réservations depuis le fichier JSON
async function loadBookings() {
    try {
        const response = await fetch('bookings.json');
        const data = await response.json();

        // Générer toutes les dates réservées à partir des périodes
        bookedDates = [];
        data.reservations.forEach(reservation => {
            const dates = generateDateRange(reservation.startDate, reservation.endDate);
            bookedDates.push(...dates);
        });

        renderCalendar();
    } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
        // Continuer avec un tableau vide si le fichier n'existe pas
        bookedDates = [];
        renderCalendar();
    }
}

// Fonction pour générer toutes les dates entre deux dates
function generateDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    while (start <= end) {
        dates.push(formatDate(start));
        start.setDate(start.getDate() + 1);
    }

    return dates;
}

// Fonction pour formater une date en YYYY-MM-DD
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Fonction pour déterminer la saison d'une date
function getSeason(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Vérifier chaque période de prix
    for (const [seasonKey, season] of Object.entries(pricingByPeriod)) {
        for (const period of season.periods) {
            // Gérer le cas spécial de la période de fêtes qui traverse l'année
            if (period.start > period.end) {
                if (dateStr >= period.start || dateStr <= period.end) {
                    return seasonKey;
                }
            } else {
                if (dateStr >= period.start && dateStr <= period.end) {
                    return seasonKey;
                }
            }
        }
    }

    // Par défaut, retourner basse saison
    return 'low';
}

// Fonction pour vérifier si une date est réservée
function isDateBooked(dateStr) {
    return bookedDates.includes(dateStr);
}

// Fonction pour vérifier si une date est dans la plage sélectionnée
function isDateInRange(dateStr) {
    if (!selectedStart || !selectedEnd) return false;
    const date = new Date(dateStr);
    const start = new Date(selectedStart);
    const end = new Date(selectedEnd);
    return date > start && date < end;
}

// Fonction pour rendre le calendrier
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error('Élément calendrier non trouvé');
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Mise à jour du titre
    const monthDisplay = document.getElementById('monthYearDisplay');
    if (monthDisplay) {
        monthDisplay.textContent = currentDate.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric'
        });
    }

    // Vider le calendrier
    calendar.innerHTML = '';

    // En-têtes des jours
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Espaces vides avant le premier jour
    for (let i = 0; i < startingDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell empty';
        calendar.appendChild(empty);
    }

    // Jours du mois
    const today = formatDate(new Date());
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(new Date(year, month, day));
        const currentCellDate = new Date(year, month, day);
        currentCellDate.setHours(0, 0, 0, 0);

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;
        cell.dataset.date = dateStr;

        // Vérifier si la date est dans le passé
        const isPast = currentCellDate < todayDate;

        // Marquer aujourd'hui
        if (dateStr === today) {
            cell.classList.add('today');
        }

        // Marquer les dates passées
        if (isPast) {
            cell.classList.add('past');
            cell.title = 'Date passée';
        }
        // Marquer les dates réservées
        else if (isDateBooked(dateStr)) {
            cell.classList.add('booked');
            cell.title = 'Date réservée';
        } else {
            // Dates disponibles
            // Toujours surligner les dates sélectionnées (même si une seule)
            if (dateStr === selectedStart || dateStr === selectedEnd) {
                cell.classList.add('selected');
            } else if (isDateInRange(dateStr)) {
                cell.classList.add('in-range');
            }
            // Surligner aussi si c'est la seule date sélectionnée
            else if (selectedStart && !selectedEnd && dateStr === selectedStart) {
                cell.classList.add('selected');
            }

            // Ajouter l'événement de clic seulement si la date n'est pas réservée et pas dans le passé
            cell.addEventListener('click', () => selectDate(dateStr));
        }

        calendar.appendChild(cell);
    }
}

// Fonction pour sélectionner une date
function selectDate(dateStr) {
    const clickedDate = new Date(dateStr);

    // Si aucune date n'est sélectionnée, ou si les deux dates sont déjà sélectionnées
    if (!selectedStart || (selectedStart && selectedEnd)) {
        selectedStart = dateStr;
        selectedEnd = null;
    } else {
        // Une date de début est déjà sélectionnée
        if (clickedDate > new Date(selectedStart)) {
            // Vérifier qu'il n'y a pas de dates réservées entre les deux
            const hasBookedInBetween = checkBookedInRange(selectedStart, dateStr);
            if (hasBookedInBetween) {
                alert('Il y a des dates réservées dans la période sélectionnée. Veuillez choisir une autre période.');
                return;
            }
            selectedEnd = dateStr;
        } else {
            // Si la date cliquée est avant la date de début, recommencer
            selectedStart = dateStr;
            selectedEnd = null;
        }
    }

    renderCalendar();
    updateSummary();
}

// Fonction pour vérifier s'il y a des dates réservées dans une plage
function checkBookedInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
        if (isDateBooked(formatDate(current))) {
            return true;
        }
        current.setDate(current.getDate() + 1);
    }

    return false;
}

// Fonction pour mettre à jour le résumé de la réservation
function updateSummary() {
    const summary = document.getElementById('summary');
    const legendSelected = document.getElementById('legendSelected');
    if (!summary) return;

    // Toujours afficher le bloc de résumé
    summary.classList.add('active');

    if (selectedStart && selectedEnd) {
        const start = new Date(selectedStart);
        const end = new Date(selectedEnd);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // Calculer le prix total en tenant compte des différentes saisons
        let totalPrice = 0;
        const current = new Date(start);
        const priceBreakdown = {};

        while (current < end) {
            const season = getSeason(current);
            const price = pricingByPeriod[season].price;
            totalPrice += price;

            // Compter les nuits par saison pour l'affichage
            if (!priceBreakdown[season]) {
                priceBreakdown[season] = {
                    nights: 0,
                    price: price,
                    label: pricingByPeriod[season].label
                };
            }
            priceBreakdown[season].nights++;

            current.setDate(current.getDate() + 1);
        }

        // Mettre à jour l'affichage
        const datesEl = document.getElementById('summaryDates');
        const nightsEl = document.getElementById('summaryNights');
        const breakdownEl = document.getElementById('priceBreakdown');
        const totalEl = document.getElementById('summaryTotal');

        if (datesEl) {
            datesEl.textContent = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }

        if (nightsEl) {
            nightsEl.textContent = `${days} nuit${days > 1 ? 's' : ''}`;
        }

        if (breakdownEl) {
            let breakdownHTML = '';
            for (const [season, data] of Object.entries(priceBreakdown)) {
                breakdownHTML += `<div class="price-breakdown-item">
                    <span>${data.nights} nuit${data.nights > 1 ? 's' : ''} × ${data.price}€ (${data.label})</span>
                    <span>${data.nights * data.price}€</span>
                </div>`;
            }
            // Ajouter les frais de ménage
            breakdownHTML += `<div class="price-breakdown-item">
                <span>Frais de ménage et linge de lit</span>
                <span>80€</span>
            </div>`;
            breakdownEl.innerHTML = breakdownHTML;
        }

        // Ajouter les frais de ménage au total
        const cleaningFee = 80;
        const finalTotal = totalPrice + cleaningFee;

        if (totalEl) {
            totalEl.textContent = `${finalTotal}€`;
        }

        // Afficher la légende "Période sélectionnée"
        if (legendSelected) {
            legendSelected.style.display = 'flex';
        }
    } else {
        // Afficher un message par défaut quand aucune date n'est sélectionnée
        const datesEl = document.getElementById('summaryDates');
        const nightsEl = document.getElementById('summaryNights');
        const breakdownEl = document.getElementById('priceBreakdown');
        const totalEl = document.getElementById('summaryTotal');

        if (datesEl) {
            datesEl.textContent = 'Choisir des dates pour voir les tarifs';
            datesEl.style.textAlign = 'center';
            datesEl.style.fontStyle = 'italic';
        }

        if (nightsEl) {
            nightsEl.textContent = '';
        }

        if (breakdownEl) {
            breakdownEl.innerHTML = '';
        }

        if (totalEl) {
            totalEl.textContent = '';
        }

        // Masquer la légende "Période sélectionnée"
        if (legendSelected) {
            legendSelected.style.display = 'none';
        }
    }
}

// Fonction pour changer de mois
function changeMonth(delta) {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);

    // Empêcher de naviguer vers un mois passé
    const today = new Date();
    today.setDate(1); // Premier jour du mois actuel
    today.setHours(0, 0, 0, 0);

    // Empêcher de naviguer au-delà de janvier 2027
    const maxDate = new Date(2027, 0, 1); // 1er janvier 2027
    maxDate.setHours(0, 0, 0, 0);

    newDate.setDate(1);
    newDate.setHours(0, 0, 0, 0);

    if (newDate >= today && newDate <= maxDate) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        renderCalendar();
        updateNavigationButtons();
    }
}

// Fonction pour changer d'année
function changeYear(delta) {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + delta);

    // Empêcher de naviguer vers une année passée
    const today = new Date();
    today.setMonth(0, 1); // Premier jour de l'année actuelle
    today.setHours(0, 0, 0, 0);

    // Empêcher de naviguer au-delà de 2027
    const maxYear = new Date(2027, 0, 1); // 1er janvier 2027
    maxYear.setHours(0, 0, 0, 0);

    newDate.setMonth(0, 1);
    newDate.setHours(0, 0, 0, 0);

    if (newDate >= today && newDate <= maxYear) {
        currentDate.setFullYear(currentDate.getFullYear() + delta);
        renderCalendar();
        updateNavigationButtons();
    }
}

// Fonction pour mettre à jour l'état des boutons de navigation
function updateNavigationButtons() {
    const today = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Date limite : janvier 2027
    const maxMonth = new Date(2027, 0, 1);

    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const prevYearBtn = document.getElementById('prevYear');
    const nextYearBtn = document.getElementById('nextYear');

    // Désactiver le bouton "mois précédent" si on est au mois actuel
    if (prevMonthBtn) {
        if (currentMonth <= todayMonth) {
            prevMonthBtn.disabled = true;
            prevMonthBtn.style.opacity = '0.3';
            prevMonthBtn.style.cursor = 'not-allowed';
        } else {
            prevMonthBtn.disabled = false;
            prevMonthBtn.style.opacity = '1';
            prevMonthBtn.style.cursor = 'pointer';
        }
    }

    // Désactiver le bouton "mois suivant" si on est à janvier 2027
    if (nextMonthBtn) {
        if (currentMonth >= maxMonth) {
            nextMonthBtn.disabled = true;
            nextMonthBtn.style.opacity = '0.3';
            nextMonthBtn.style.cursor = 'not-allowed';
        } else {
            nextMonthBtn.disabled = false;
            nextMonthBtn.style.opacity = '1';
            nextMonthBtn.style.cursor = 'pointer';
        }
    }

    // Désactiver le bouton "année précédente" si on est à l'année actuelle
    if (prevYearBtn) {
        const currentYear = currentDate.getFullYear();
        const todayYear = today.getFullYear();

        if (currentYear <= todayYear) {
            prevYearBtn.disabled = true;
            prevYearBtn.style.opacity = '0.3';
            prevYearBtn.style.cursor = 'not-allowed';
        } else {
            prevYearBtn.disabled = false;
            prevYearBtn.style.opacity = '1';
            prevYearBtn.style.cursor = 'pointer';
        }
    }

    // Désactiver le bouton "année suivante" si on est en 2027
    if (nextYearBtn) {
        const currentYear = currentDate.getFullYear();

        if (currentYear >= 2027) {
            nextYearBtn.disabled = true;
            nextYearBtn.style.opacity = '0.3';
            nextYearBtn.style.cursor = 'not-allowed';
        } else {
            nextYearBtn.disabled = false;
            nextYearBtn.style.opacity = '1';
            nextYearBtn.style.cursor = 'pointer';
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
    // Event listeners pour la navigation
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const prevYear = document.getElementById('prevYear');
    const nextYear = document.getElementById('nextYear');

    if (prevMonth) prevMonth.addEventListener('click', () => changeMonth(-1));
    if (nextMonth) nextMonth.addEventListener('click', () => changeMonth(1));
    if (prevYear) prevYear.addEventListener('click', () => changeYear(-1));
    if (nextYear) nextYear.addEventListener('click', () => changeYear(1));

    // Charger les réservations et afficher le calendrier
    loadBookings();

    // Mettre à jour l'état des boutons de navigation
    updateNavigationButtons();

    // Afficher le bloc de résumé dès le chargement
    updateSummary();
});
