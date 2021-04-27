const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

let db = admin.firestore();

//
//

exports.startGame = functions.https.onCall((data, context) => {
	const ANNOUNCE_TIMER = 8000;
	const randomNumbers = data.randomNumbers;
	const roomId = data.roomId;

	const docRef = db.collection('rooms').doc(roomId);

	let timer;

	const stopGameAndShowWinners = () => {
		clearInterval(timer);
		docRef.get().then((doc) => {
			const room = doc.data();
			const players = room.players;

			const winners = players.sort((playerA, playerB) => {
				if (playerA.score < playerB.score) return 1;
				if (playerA.score > playerB.score) return -1;

				if (playerA.scoreUpdateTime > playerB.scoreUpdateTime) return 1;
				if (playerA.scoreUpdateTime < playerB.scoreUpdateTime) return -1;
			});

			docRef.update({
				winners,
				status: 'complete',
				speakWinner: true,
				currentNumber: randomNumbers[99],
				currentIterator: 99,
				speakNumber: false,
			});
		});
	};

	docRef.onSnapshot((doc) => {
		const room = doc.data();
		const players = room.players;

		const allPlayersCheck = players.filter((each) => {
			if (each.score === 10 && each.complete === true) {
				return true;
			}
		});

		// console.log(allPlayersCheck.length === room.players.length);
		// console.log(allPlayersCheck.length);
		// console.log(room.players.length);

		if (allPlayersCheck.length === room.players.length) {
			stopGameAndShowWinners();
		}
	});

	return docRef
		.update({
			status: 'playing',
			randomNumbers,
			nextNumberTimer: ANNOUNCE_TIMER,
		})
		.then(() => {
			let i = 0;

			const updater = () => {
				docRef.update({
					currentNumber: randomNumbers[i],
					currentIterator: i,
					speakNumber: true,
				});

				i++;
			};

			timer = setInterval(() => {
				if (i < 100) {
					updater();
				} else {
					stopGameAndShowWinners();
				}
			}, ANNOUNCE_TIMER);

			updater();

			return {
				message: 'Starting game please wait',
			};
		});
});
