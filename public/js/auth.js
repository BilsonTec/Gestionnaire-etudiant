// @ts-nocheck
import { firebaseConfig } from "./config-firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";



// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
auth.languageCode = "fr";

// Fonctions utilitaires
const showError = (element, message) => {
    if (element) {
        element.textContent = message;
        element.style.opacity = 1;
    }
};

const hideError = (element) => {
    if (element) element.style.opacity = 0;
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const checkPasswordStrength = (password) => {
    let strength = 0;
    const bars = document.querySelectorAll('.strength-bar');
    const text = document.querySelector('.strength-text');
    
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    
    bars.forEach((bar, index) => {
        bar.style.backgroundColor = index < strength ? getStrengthColor(strength) : '#e0e0e0';
    });
    
    const strengthTexts = ['Faible', 'Moyen', 'Fort', 'Très fort'];
    text.textContent = strengthTexts[strength - 1] || 'Faible';
    text.style.color = getStrengthColor(strength);
};

const getStrengthColor = (strength) => {
    const colors = ['#ff4444', '#ffa500', '#4caf50', '#4caf50'];
    return colors[strength - 1] || '#ff4444';
};

const translateError = (code) => {
    const errorMessages = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/invalid-email': 'Adresse email invalide.',
        'auth/weak-password': 'Le mot de passe est trop faible (minimum 6 caractères).',
        'auth/user-not-found': 'Utilisateur non trouvé.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/invalid-credential': 'Identifiants ou Mot de passe invalides.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
        'permission-denied': 'Permission refusée : impossible d\'enregistrer les données.',
        'unavailable': 'Service Firestore indisponible. Vérifiez votre connexion.',
        'default': 'Une erreur est survenue. Veuillez réessayer.'
    };
    return errorMessages[code] || errorMessages.default;
};

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

// Bascule entre inscription et connexion
document.addEventListener('DOMContentLoaded', () => {
    const registerContainer = document.getElementById('register-container');
    const loginContainer = document.getElementById('login-container');
    const toLogin = document.getElementById('to-login');
    const toRegister = document.getElementById('to-register');

    if (toLogin && toRegister && registerContainer && loginContainer) {
        toLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
        });

        toRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'flex';
        });
    }

    // Toggle password visibility
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Gestion du formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        const confirmInput = document.getElementById('register-confirm');
        const emailError = document.getElementById('email-error');
        const confirmError = document.getElementById('confirm-error');
        const submitBtn = registerForm.querySelector('.btn-submit');

        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });

        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            let isValid = true;

            if (!validateEmail(emailInput.value)) {
                showError(emailError, 'Veuillez entrer une adresse email valide');
                isValid = false;
            } else {
                hideError(emailError);
            }

            if (passwordInput.value !== confirmInput.value) {
                showError(confirmError, 'Les mots de passe ne correspondent pas');
                isValid = false;
            } else {
                hideError(confirmError);
            }

            if (isValid) {
                submitBtn.classList.add('loading');
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
                    const user = userCredential.user;
                    await updateProfile(user, { displayName: emailInput.value });
                    const role = emailInput.value.includes('prof') ? 'professeur' : 'etudiant';
                    await setDoc(doc(db, 'utilisateurs', user.uid), {
                        fullName: emailInput.value,
                        email: emailInput.value,
                        createdAt: new Date().toISOString(),
                        role,
                        lastLogin: new Date().toISOString(),
                        coursInscrits: [],
                        coursCrees: []
                    });
                    showNotification('Inscription réussie ! Redirection...');
                    setTimeout(() => {
                        window.location.href = role === 'professeur' ? '../html/admin.html' : '../html/etudiant.html';
                    }, 1000);
                } catch (error) {
                    console.error('Erreur inscription :', error.code, error.message);
                    showError(emailError, translateError(error.code));
                } finally {
                    submitBtn.classList.remove('loading');
                }
            }
        });
    }

    // Gestion du formulaire de connexion et réinitialisation
    const authForm = document.getElementById('authForm');
    if (authForm) {
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        const emailError = document.getElementById('auth-email-error');
        const submitBtn = authForm.querySelector('.btn-submit');
        const btnText = document.getElementById('btn-text');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const passwordGroup = document.getElementById('password-group');
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        const resetFooter = document.getElementById('reset-footer');
        const backToLogin = document.getElementById('back-to-login');
        let isResetMode = false;

        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            isResetMode = true;
            formTitle.textContent = 'Réinitialiser le mot de passe';
            formSubtitle.textContent = 'Entrez votre email pour recevoir un lien de réinitialisation';
            passwordGroup.style.display = 'none';
            btnText.textContent = 'Envoyer le lien';
            resetFooter.style.display = 'block';
            hideError(emailError);
        });

        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            isResetMode = false;
            formTitle.textContent = 'Connectez-vous';
            formSubtitle.innerHTML = 'Nouveau ici ? <a href="#" id="to-register">Créez un compte</a>';
            passwordGroup.style.display = 'block';
            btnText.textContent = 'Se connecter';
            resetFooter.style.display = 'none';
            hideError(emailError);
            const newToRegister = document.getElementById('to-register');
            if (newToRegister) {
                newToRegister.addEventListener('click', (e) => {
                    e.preventDefault();
                    loginContainer.style.display = 'none';
                    registerContainer.style.display = 'flex';
                });
            }
        });

        authForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            let isValid = true;

            if (!validateEmail(emailInput.value)) {
                showError(emailError, 'Veuillez entrer une adresse email valide');
                isValid = false;
            } else {
                hideError(emailError);
            }

            if (isValid) {
                submitBtn.classList.add('loading');
                try {
                    if (isResetMode) {
                        await sendPasswordResetEmail(auth, emailInput.value);
                        showNotification('Lien de réinitialisation envoyé ! Vérifiez votre email.');
                        isResetMode = false;
                        formTitle.textContent = 'Connectez-vous';
                        formSubtitle.innerHTML = 'Nouveau ici ? <a href="#" id="to-register">Créez un compte</a>';
                        passwordGroup.style.display = 'block';
                        btnText.textContent = 'Se connecter';
                        resetFooter.style.display = 'none';
                        const newToRegister = document.getElementById('to-register');
                        if (newToRegister) {
                            newToRegister.addEventListener('click', (e) => {
                                e.preventDefault();
                                loginContainer.style.display = 'none';
                                registerContainer.style.display = 'flex';
                            });
                        }
                    } else {
                        const userCredential = await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
                        const user = userCredential.user;
                        await setDoc(doc(db, 'utilisateurs', user.uid), {
                            lastLogin: new Date().toISOString()
                        }, { merge: true });
                        const userDoc = await getDoc(doc(db, 'utilisateurs', user.uid));
                        if (userDoc.exists()) {
                            const role = userDoc.data().role;
                            showNotification('Connexion réussie ! Redirection...');
                            setTimeout(() => {
                                window.location.href = role === 'professeur' ? '../html/admin.html' : '../html/etudiant.html';
                            }, 1000);
                        } else {
                            console.error('Document utilisateur non trouvé.');
                            showError(emailError, 'Utilisateur non trouvé dans la base de données.');
                        }
                    }
                } catch (error) {
                    console.error('Erreur connexion :', error.code, error.message);
                    showError(emailError, translateError(error.code));
                } finally {
                    submitBtn.classList.remove('loading');
                }
            }
        });
    }
});

export { auth, db };