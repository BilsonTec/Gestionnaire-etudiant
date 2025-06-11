// @ts-nocheck
document.addEventListener('DOMContentLoaded', function() {

    // Gestion de l'accordéon FAQ
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const isActive = accordionItem.classList.contains('active');

            // Fermer tous les autres
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.accordion-content').style.maxHeight = null;
            });

            // Ouvrir / fermer celui cliqué
            if (!isActive) {
                accordionItem.classList.add('active');
                const content = accordionItem.querySelector('.accordion-content');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });

    // Animation du bouton de soumission du formulaire
    const contactForm = document.getElementById('contactForm');
    const submitButton = contactForm.querySelector('.btn-submit');
    const btnText = submitButton.querySelector('.btn-text');
    const btnLoader = submitButton.querySelector('.btn-loader');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Activer le loader
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';

        // Simuler l'envoi (ex: 2 sec)
        setTimeout(() => {
            // Remettre le bouton normal
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';

            // Reset formulaire
            contactForm.reset();

            // Message de confirmation
            alert('Votre message a bien été envoyé. Merci de nous avoir contactés !');
        }, 2000);
    });
});