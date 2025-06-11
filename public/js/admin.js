// @ts-nocheck
import { auth, db } from './auth.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, deleteDoc, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
    } else {
        console.warn('Notification container not found');
    }
};

// Vérifier l'état de l'authentification
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'utilisateurs', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role !== 'professeur') {
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
                if (welcomeName) welcomeName.textContent = userData.fullName || 'Professeur';
                if (userEmail) userEmail.textContent = userData.email || 'Inconnu';
                if (userRole) userRole.textContent = userData.role || 'Inconnu';
                if (lastLogin) lastLogin.textContent = userData.lastLogin ? new Date(userData.lastLogin).toLocaleString('fr-FR') : 'Jamais';

                // Charger les données
                loadCourses(user.uid);
                loadSchedules(user.uid);
                loadNotes(user.uid);
            } else {
                showNotification('Utilisateur non trouvé. Redirection...', true);
                setTimeout(() => window.location.href = '../index.html', 1000);
            }
        } catch (error) {
            console.error('Erreur Firestore :', error);
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
            console.log('Bouton de déconnexion cliqué (dashboard professeur)');
            isLoggingOut = true;
            try {
                await signOut(auth);
                showNotification('Déconnexion réussie ! Redirection...');
                setTimeout(() => {
                    window.location.href = '../index.html';
                    isLoggingOut = false;
                }, 1000);
            } catch (error) {
                console.error('Erreur de déconnexion :', error);
                showNotification('Erreur lors de la déconnexion.', true);
                isLoggingOut = false;
            }
        });
    } else {
        console.error('Bouton de déconnexion non trouvé (#logout-btn)');
    }
});

// Gestion des cours
const courseForm = document.getElementById('course-form');
if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('course-name').value;
        const description = document.getElementById('course-description').value;
        const submitBtn = courseForm.querySelector('.btn-submit');
        submitBtn.disabled = true;

        try {
            const courseRef = await addDoc(collection(db, 'cours'), {
                name,
                description,
                professeur: auth.currentUser.email,
                professeurId: auth.currentUser.uid,
                createdAt: new Date().toISOString(),
                etudiants: []
            });

            const userRef = doc(db, 'utilisateurs', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            const coursCrees = userDoc.exists() && userDoc.data().coursCrees ? userDoc.data().coursCrees : [];
            await setDoc(userRef, { coursCrees: [...coursCrees, courseRef.id] }, { merge: true });

            showNotification('Cours ajouté avec succès !');
            courseForm.reset();
        } catch (error) {
            console.error('Erreur ajout cours :', error);
            showNotification('Erreur lors de l\'ajout du cours.', true);
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function loadCourses(userId) {
    const courseList = document.getElementById('course-list');
    const scheduleCourseSelect = document.getElementById('schedule-course');
    const noteCourseSelect = document.getElementById('note-course');

    if (!courseList || !scheduleCourseSelect || !noteCourseSelect) return;

    onSnapshot(collection(db, 'cours'), (snapshot) => {
        courseList.innerHTML = '';
        scheduleCourseSelect.innerHTML = '<option value="">Sélectionnez un cours</option>';
        noteCourseSelect.innerHTML = '<option value="">Sélectionnez un cours</option>';

        snapshot.forEach((doc) => {
            if (doc.data().professeurId === userId) {
                const course = doc.data();
                // Liste des cours
                const li = document.createElement('li');
                li.className = 'course-item';
                li.innerHTML = `
                    <div>
                        <p><strong>${course.name}</strong></p>
                        <p>${course.description || 'Pas de description'}</p>
                        <p>Étudiants inscrits : ${course.etudiants.length}</p>
                    </div>
                    <button class="btn-action btn-delete" data-id="${doc.id}">Supprimer</button>
                `;
                courseList.appendChild(li);

                // Options pour les select
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = course.name;
                scheduleCourseSelect.appendChild(option.cloneNode(true));
                noteCourseSelect.appendChild(option);
            }
        });

        // Gestion suppression cours
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const courseId = btn.getAttribute('data-id');
                try {
                    await deleteDoc(doc(db, 'cours', courseId));
                    const userRef = doc(db, 'utilisateurs', userId);
                    const userDoc = await getDoc(userRef);
                    const coursCrees = userDoc.data().coursCrees.filter(id => id !== courseId);
                    await setDoc(userRef, { coursCrees }, { merge: true });
                    showNotification('Cours supprimé avec succès !');
                } catch (error) {
                    console.error('Erreur suppression cours :', error);
                    showNotification('Erreur lors de la suppression.', true);
                }
            });
        });
    });
}

// Gestion de l'emploi du temps
const scheduleForm = document.getElementById('schedule-form');
if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseId = document.getElementById('schedule-course').value;
        const dateTime = document.getElementById('schedule-datetime').value;
        const duration = parseInt(document.getElementById('schedule-duration').value);
        const location = document.getElementById('schedule-location').value;
        const submitBtn = scheduleForm.querySelector('.btn-submit');
        submitBtn.disabled = true;

        try {
            await addDoc(collection(db, 'emplois_du_temps'), {
                courseId,
                professeurId: auth.currentUser.uid,
                dateTime: new Date(dateTime).toISOString(),
                duration,
                location,
                createdAt: new Date().toISOString()
            });
            showNotification('Créneau ajouté avec succès !');
            scheduleForm.reset();
        } catch (error) {
            console.error('Erreur ajout créneau :', error);
            showNotification('Erreur lors de l\'ajout du créneau.', true);
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function loadSchedules(userId) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    onSnapshot(collection(db, 'emplois_du_temps'), async (snapshot) => {
        scheduleList.innerHTML = '';
        const courses = await getDocs(collection(db, 'cours'));
        const courseMap = {};
        courses.forEach(doc => courseMap[doc.id] = doc.data().name);

        snapshot.forEach((doc) => {
            if (doc.data().professeurId === userId) {
                const schedule = doc.data();
                const li = document.createElement('li');
                li.className = 'schedule-item';
                li.innerHTML = `
                    <div>
                        <p><strong>${courseMap[schedule.courseId] || 'Cours inconnu'}</strong></p>
                        <p>${new Date(schedule.dateTime).toLocaleString('fr-FR')}</p>
                        <p>Durée : ${schedule.duration} min</p>
                        <p>Lieu : ${schedule.location || 'Non spécifié'}</p>
                    </div>
                    <button class="btn-action btn-delete" data-id="${doc.id}">Supprimer</button>
                `;
                scheduleList.appendChild(li);
            }
        });

        // Gestion suppression créneau
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const scheduleId = btn.getAttribute('data-id');
                if (!scheduleId) {
                    showNotification('Erreur : ID du créneau manquant.', true);
                    return;
                }
                try {
                    const scheduleRef = doc(db, 'emplois_du_temps', scheduleId);
                    const scheduleDoc = await getDoc(scheduleRef);
                    if (!scheduleDoc.exists()) {
                        throw new Error('Créneau non trouvé.');
                    }
                    await deleteDoc(scheduleRef);
                    showNotification('Créneau supprimé avec succès !');
                } catch (error) {
                    console.error('Erreur suppression créneau :', error.message);
                    showNotification(`Erreur : ${error.message}`, true);
                }
            });
        });
    });
}

// Gestion des notes
const noteForm = document.getElementById('note-form');
if (noteForm) {
    const courseSelect = document.getElementById('note-course');
    const studentSelect = document.getElementById('note-student');

    // Charger les étudiants par cours
    courseSelect.addEventListener('change', async () => {
        studentSelect.innerHTML = '<option value="">Sélectionnez un étudiant</option>';
        const courseId = courseSelect.value;
        if (!courseId) {
            showNotification('Veuillez sélectionner un cours.', true);
            return;
        }
        try {
            const courseDoc = await getDoc(doc(db, 'cours', courseId));
            console.log('Course Doc :', courseDoc.exists(), courseDoc.data());
            if (!courseDoc.exists()) {
                showNotification('Cours non trouvé.', true);
                return;
            }
            const etudiants = courseDoc.data().etudiants || [];
            console.log('Étudiants inscrits :', etudiants);
            if (etudiants.length === 0) {
                showNotification('Aucun étudiant inscrit à ce cours.', true);
                return;
            }
            const users = await Promise.all(etudiants.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'utilisateurs', uid));
                    return userDoc.exists() ? { uid, email: userDoc.data().email } : null;
                } catch (err) {
                    console.error(`Erreur lecture utilisateur ${uid} :`, err);
                    return null;
                }
            }));
            const validUsers = users.filter(u => u);
            if (validUsers.length === 0) {
                showNotification('Aucun étudiant valide trouvé.', true);
                return;
            }
            validUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.uid;
                option.textContent = user.email;
                studentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur chargement étudiants :', error.message);
            showNotification('Erreur lors du chargement des étudiants.', true);
        }
    });

    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseId = courseSelect.value;
        const etudiantId = studentSelect.value;
        const note = parseFloat(document.getElementById('note-value').value);
        const commentaire = document.getElementById('note-comment').value;
        const submitBtn = noteForm.querySelector('.btn-submit');
        submitBtn.disabled = true;

        try {
            if (!courseId || !etudiantId) {
                throw new Error('Veuillez sélectionner un cours et un étudiant.');
            }
            const noteData = {
                courseId,
                etudiantId,
                professeurId: auth.currentUser.uid,
                note,
                commentaire,
                createdAt: new Date().toISOString()
            };
            console.log('Envoi note :', noteData);
            const noteRef = await addDoc(collection(db, 'notes'), noteData);
            console.log('Note ajoutée, ID :', noteRef.id);
            showNotification('Note attribuée avec succès !');
            noteForm.reset();
            studentSelect.innerHTML = '<option value="">Sélectionnez un étudiant</option>';
        } catch (error) {
            console.error('Erreur ajout note :', error.message);
            showNotification(`Erreur : ${error.message}`, true);
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function loadNotes(userId) {
    const noteList = document.getElementById('note-list');
    if (!noteList) return;

    onSnapshot(collection(db, 'notes'), async (snapshot) => {
        noteList.innerHTML = '';
        console.log('Notes snapshot reçu, taille :', snapshot.size);

        let courseMap = {};
        let userMap = {};
        try {
            const courses = await getDocs(collection(db, 'cours'));
            courses.forEach(doc => courseMap[doc.id] = doc.data().name || 'Cours inconnu');
            console.log('Course Map :', courseMap);
        } catch (error) {
            console.error('Erreur chargement cours :', error.message);
            showNotification('Erreur lors du chargement des cours.', true);
        }

        try {
            const users = await getDocs(collection(db, 'utilisateurs'));
            users.forEach(doc => userMap[doc.id] = doc.data().email || 'Inconnu');
            console.log('User Map :', userMap);
        } catch (error) {
            console.error('Erreur chargement utilisateurs :', error.message);
            showNotification('Erreur lors du chargement des utilisateurs.', true);
        }

        let hasNotes = false;
        snapshot.forEach((doc) => {
            const note = doc.data();
            console.log('Note doc :', doc.id, note);
            if (note.professeurId && note.professeurId === userId) {
                hasNotes = true;
                const li = document.createElement('li');
                li.className = 'note-item';
                li.innerHTML = `
                    <div>
                        <p><strong>${courseMap[note.courseId] || 'Cours inconnu'}</strong></p>
                        <p>Étudiant : ${userMap[note.etudiantId] || 'Inconnu'}</p>
                        <p>Note : ${note.note}/20</p>
                        <p>${note.commentaire || 'Aucun commentaire'}</p>
                    </div>
                    <button class="btn-action btn-delete" data-id="${doc.id}">Supprimer</button>
                `;
                noteList.appendChild(li);
            }
        });

        if (!hasNotes) {
            showNotification('Aucune note trouvée pour ce professeur.', false);
            noteList.innerHTML = '<li>Aucune note attribuée.</li>';
        }

        // Gestion suppression note
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const noteId = btn.getAttribute('data-id');
                try {
                    await deleteDoc(doc(db, 'notes', noteId));
                    showNotification('Note supprimée avec succès !');
                } catch (error) {
                    console.error('Erreur suppression note :', error.message);
                    showNotification(`Erreur : ${error.message}`, true);
                }
            });
        });
    }, (error) => {
        console.error('Erreur onSnapshot notes :', error.message);
        showNotification('Erreur lors du chargement des notes.', true);
    });
}