// @ts-nocheck
import { auth, db } from './auth.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Variable pour suivre l'état de déconnexion
let isLoggingOut = false;

// Fonction pour afficher une notification
const showNotification = (message, isError = false) => {
    const container = document.getElementById('notification-container');
    if (container) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.background = isError ? 'var(--color-danger)' : 'var(--color-success)';
        notification.innerHTML = `<i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
        container.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

// Vérifier l'état de l'authentification
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'utilisateurs', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role !== 'etudiant') {
                    showNotification('Accès non autorisé. Redirection...', true);
                    setTimeout(() => window.location.href = '../index.html', 1000);
                    return;
                }
                // Afficher les données
                const userName = document.getElementById('user-name');
                const welcomeName = document.getElementById('welcome-name');
                const userEmail = document.getElementById('user-email');
                const userRole = document.getElementById('user-role');
                const lastLogin = document.getElementById('last-login');

                if (userName) userName.textContent = userData.fullName || 'Inconnu';
                if (welcomeName) welcomeName.textContent = userData.fullName || 'Étudiant';
                if (userEmail) userEmail.textContent = userData.email || 'Inconnu';
                if (userRole) userRole.textContent = userData.role || 'Étudiant';
                if (lastLogin) lastLogin.textContent = userData.lastLogin ? new Date(userData.lastLogin).toLocaleString('fr-FR') : 'Jamais';

                // Charger les données
                loadCourses(user.uid, userData.coursInscrits || []);
                loadSchedules(user.uid, userData.coursInscrits || []);
                loadNotes(user.uid);
            } else {
                showNotification('Utilisateur non trouvé. Redirection...', true);
                setTimeout(() => window.location.href = '../index.html', 1000);
            }
        } catch (error) {
            
            showNotification('Erreur de chargement. Redirection...', true);
            setTimeout(() => window.location.href = '../index.html', 1000);
        }
    } else if (!isLoggingOut) {
        showNotification('Veuillez vous connecter.', true);
        setTimeout(() => window.location.href = '../index.html', 1000);
    }
});

// Gestion de la déconnexion
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            isLoggingOut = true;
            try {
                await signOut(auth);
                showNotification('Déconnexion réussie ! Redirection...');
                setTimeout(() => {
                    window.location.href = '../index.html';
                    isLoggingOut = false;
                }, 1000);
            } catch (error) {
                
                showNotification('Erreur lors de la déconnexion.', true);
                isLoggingOut = false;
            }
        });
    } 
});

// Gestion des cours
function loadCourses(userId, coursInscrits) {
    const enrolledList = document.getElementById('enrolled-course-list');
    const availableList = document.getElementById('available-course-list');
    if (!enrolledList || !availableList) return;

    onSnapshot(collection(db, 'cours'), (snapshot) => {
        enrolledList.innerHTML = '';
        availableList.innerHTML = '';

        snapshot.forEach((doc) => {
            const course = doc.data();
            const li = document.createElement('li');
            li.className = 'course-item';
            const isEnrolled = coursInscrits.includes(doc.id);

            li.innerHTML = `
                <div>
                    <p><strong>${course.name}</strong></p>
                    <p>${course.description || 'Pas de description'}</p>
                    <p>Professeur : ${course.professeur}</p>
                </div>
                <div>
                    <button class="btn-action ${isEnrolled ? 'btn-delete' : ''}" data-id="${doc.id}" data-action="${isEnrolled ? 'unenroll' : 'enroll'}">
                        ${isEnrolled ? 'Se désinscrire' : 'S\'inscrire'}
                    </button>
                </div>
            `;

            if (isEnrolled) {
                enrolledList.appendChild(li);
            } else {
                availableList.appendChild(li);
            }
        });

        // Gestion inscription/désinscription
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const courseId = btn.getAttribute('data-id');
                const action = btn.getAttribute('data-action');
                if (!courseId || !userId) {
                    showNotification('Erreur : Identifiants manquants.', true);
                    return;
                }

                try {
                    const courseRef = doc(db, 'cours', courseId);
                    const courseDoc = await getDoc(courseRef);
                    if (!courseDoc.exists()) {
                        throw new Error('Cours non trouvé.');
                    }

                    const userRef = doc(db, 'utilisateurs', userId);
                    const userDoc = await getDoc(userRef);
                    if (!userDoc.exists()) {
                        throw new Error('Utilisateur non trouvé.');
                    }

                    let etudiants = courseDoc.data().etudiants || [];
                    let userCourses = userDoc.data().coursInscrits || [];

                    if (action === 'enroll') {
                        if (etudiants.includes(userId)) {
                            showNotification('Vous êtes déjà inscrit à ce cours.', true);
                            return;
                        }
                        etudiants = [...etudiants, userId];
                        userCourses = [...userCourses, courseId];
                        await updateDoc(courseRef, { etudiants });
                        await setDoc(userRef, { coursInscrits: userCourses }, { merge: true });
                        showNotification('Inscription réussie !');
                    } else {
                        if (!etudiants.includes(userId)) {
                            showNotification('Vous n\'êtes pas inscrit à ce cours.', true);
                            return;
                        }
                        etudiants = etudiants.filter(id => id !== userId);
                        userCourses = userCourses.filter(id => id !== courseId);
                        await updateDoc(courseRef, { etudiants });
                        await setDoc(userRef, { coursInscrits: userCourses }, { merge: true });
                        showNotification('Désinscription réussie !');
                    }
                } catch (error) {
                    console.error('Erreur inscription/désinscription :', error.message);
                    showNotification(`Erreur : ${error.message}`, true);
                }
            });
        });
    });
}

// Gestion de l'emploi du temps
function loadSchedules(userId, coursInscrits) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    onSnapshot(collection(db, 'emplois_du_temps'), async (snapshot) => {
        scheduleList.innerHTML = '';
        const courses = await getDocs(collection(db, 'cours'));
        const courseMap = {};
        courses.forEach(doc => courseMap[doc.id] = doc.data().name);

        snapshot.forEach((doc) => {
            const schedule = doc.data();
            if (coursInscrits.includes(schedule.courseId)) {
                const li = document.createElement('li');
                li.className = 'schedule-item';
                li.innerHTML = `
                    <div>
                        <p><strong>${courseMap[schedule.courseId] || 'Cours inconnu'}</strong></p>
                        <p>${new Date(schedule.dateTime).toLocaleString('fr-FR')}</p>
                        <p>Durée : ${schedule.duration} min</p>
                        <p>Lieu : ${schedule.location || 'Non spécifié'}</p>
                    </div>
                `;
                scheduleList.appendChild(li);
            }
        });
    });
}

// Gestion des notes
function loadNotes(userId) {
    const noteList = document.getElementById('note-list');
    if (!noteList) return;

    onSnapshot(collection(db, 'notes'), async (snapshot) => {
        noteList.innerHTML = '';
        console.log('Notes snapshot reçu (étudiant), taille :', snapshot.size);

        let courseMap = {};
        try {
            const courses = await getDocs(collection(db, 'cours'));
            courses.forEach(doc => courseMap[doc.id] = doc.data().name || 'Cours inconnu');
          
        } catch (error) {
          
            showNotification('Erreur lors du chargement des cours.', true);
        }

        let hasNotes = false;
        snapshot.forEach((doc) => {
            const note = doc.data();
            console.log('Note doc (étudiant) :', doc.id, note);
            if (note.etudiantId && note.etudiantId === userId) {
                hasNotes = true;
                const li = document.createElement('li');
                li.className = 'note-item';
                li.innerHTML = `
                    <div>
                        <p><strong>${courseMap[note.courseId] || 'Cours inconnu'}</strong></p>
                        <p>Note : ${note.note}/20</p>
                        <p>${note.commentaire || 'Aucun commentaire'}</p>
                    </div>
                `;
                noteList.appendChild(li);
            }
        });

        if (!hasNotes) {
            showNotification('Aucune note trouvée pour cet étudiant.', false);
            noteList.innerHTML = '<li>Aucune note reçue.</li>';
        }
    }, (error) => {
        
        showNotification('Erreur lors du chargement des notes.', true);
    });
}