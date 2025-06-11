// @ts-nocheck
document.addEventListener('DOMContentLoaded', function() {
    // Menu Hamburger
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.querySelector('.navbar');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navbar.classList.toggle('active');
    });

    // Fermer le menu quand on clique sur un lien
    const navLinks = document.querySelectorAll('.nav-list a:not(.dropdown > a)');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navbar.classList.remove('active');
        });
    });


    // Fermer le menu quand on clique en dehors
    document.addEventListener('click', function(e) {
        if (!navbar.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navbar.classList.remove('active');
        }
    });

    // Animation au scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(element => {
        observer.observe(element);
    });
});


// Fonction pour ajouter une classe d'animation
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });