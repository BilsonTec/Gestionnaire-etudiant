// @ts-nocheck
document.addEventListener('DOMContentLoaded', function() {
   

    // Animation des statistiques
    const statItems = document.querySelectorAll('.stat-item h3');
    
    const animateStats = () => {
        statItems.forEach(item => {
            const target = parseInt(item.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    item.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    item.textContent = target;
                }
            };
            
            updateCounter();
        });
    };
    
    // Détecter quand la section est visible
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.mission-stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

        // Animation au scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // Si tu veux que l'animation ne se déclenche qu'une fois
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Sélectionner tous les éléments à animer au scroll
    const scrollElements = document.querySelectorAll('.about-page section, .footer .footer-col, .footer-bottom');
    
    scrollElements.forEach(element => {
        observer.observe(element);
    });

});
