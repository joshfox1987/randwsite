document.addEventListener('DOMContentLoaded', function() {
    try {
        const db = firebase.firestore();
        const gallery = document.getElementById('gallery');

        db.collection('gallery_images').get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const imageUrl = doc.data().url;
                if (imageUrl) {
                    const galleryItem = document.createElement('div');
                    galleryItem.classList.add('gallery-item');
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    galleryItem.appendChild(img);
                    gallery.appendChild(galleryItem);
                }
            });
        });
    } catch (e) {
        console.error(e);
        document.getElementById('gallery').innerHTML = 'Error loading images.';
    }
});