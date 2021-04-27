// Firebase config
const firebaseConfig = {
	apiKey: 'AIzaSyCI1HPSnJsP5d4a2kXCKFRQXm6rk5Id3ic',
	authDomain: 'test-37bbe.firebaseapp.com',
	databaseURL: 'https://test-37bbe.firebaseio.com',
	projectId: 'test-37bbe',
	appId: '1:597171319972:web:b60fff801a6497ece4e231',
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Set ads
// const head = document.querySelector('head');
// head.innerHTML += `<script data-ad-client="ca-pub-5742813229840866" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>`;
