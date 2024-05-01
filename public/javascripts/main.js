document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is accessing the website from an iPhone
    const isiPhone = () => {
        return /iPhone/i.test(navigator.userAgent);
    };

    // Function to play the video on iPhone
    const playVideoOniPhone = () => {
        const video = document.querySelector('video');
        video.play();
    };

    // Check if the user is accessing from an iPhone and play the video accordingly
    if (isiPhone()) {
        playVideoOniPhone();
    }

    // You can add more JavaScript code here to handle other functionalities of your webpage
});
