const functions = firebase.functions();

const UiPlayPage = document.getElementById('play-page');
const UiRoomStatus = document.getElementById('room-status');
const UiCurrentNumber = document.getElementById('current-number');
const UiNextNumberCountDown = document.getElementById('next-number-count');
const UiTicketBox = document.getElementById('ticket-box');
const UiCurrentScore = document.getElementById('current-score');
const UiRoomName = document.getElementById('room-name');
const UiRoomId = document.getElementById('room-id');
const UiInviteBtn = document.getElementById('invite-btn');
const UiPlayersList = document.getElementById('players-list');
let UiStartBtn = document.getElementById('start-btn');
const UiExitBtn = document.getElementById('exit-btn');
const UiWinnersList = document.getElementById('winners');

const voiceSynt = speechSynthesis;

let currentUser;

const loadPlayPage = () => {
	if (!currentUser) {
		const notification = `
    <div class="notification is-danger is-light">
      <button class="delete"></button>
      <strong>Error:-</strong> Sign in to play
    </div>
    `;

		UiHandleNotifications(notification);

		return;
	}

	const roomLocalStorage = JSON.parse(localStorage.getItem('room')) || null;

	if (!roomLocalStorage) {
		location.href = '/';
		return;
	}

	const roomId = roomLocalStorage;
	const docRef = db.collection('rooms').doc(roomLocalStorage);

	let room;
	let currentNumber;
	let player;
	let playerIndex;

	const showTicket = () => {
		// Set tickets
		let UiTickets = '';

		for (let i = 0; i < player.ticketStatus.length; i++) {
			UiTickets += `
			<div class="column">
				<a
				ticket-number="${player.ticketStatus[i].number}"
				ticket-number-index="${i}"
				class="button ticket-btn
				${player.ticketStatus[i].status === 'marked' ? 'is-success' : ''}
				is-fullwidth">
				${player.ticketStatus[i].number}
				</a>
			</div>
			`;
		}

		UiTicketBox.innerHTML = UiTickets;

		const UiTicketBtns = document.querySelectorAll('.ticket-btn');

		UiTicketBtns.forEach((each) => {
			each.addEventListener('click', (evt) => {
				const UiTicketNumber = parseInt(
					evt.target.getAttribute('ticket-number')
				);
				const UiTicketNumberIndex = parseInt(
					evt.target.getAttribute('ticket-number-index')
				);

				if (UiTicketNumber === currentNumber) {
					if (player.ticketStatus[UiTicketNumberIndex].status !== 'marked') {
						evt.target.classList.add('is-success');
						player.score++;
						player.scoreUpdateTime = new Date();

						if (player.score === 10) {
							player.complete = true;
							UiTicketBox.innerHTML += `<p class="is-size-5">Your ticket is completed. wait for the game to complete to see results</p>`;
						} else {
							player.complete = false;
						}
					}

					player.ticketStatus[UiTicketNumberIndex].status = 'marked';

					room.players[playerIndex] = player;

					docRef.update({
						players: room.players,
						speakNumber: false,
					});
				} else {
					console.log('wrong number');
				}
			});
		});
	};

	db.collection('rooms')
		.doc(roomLocalStorage)
		.get()
		.then((doc) => {
			room = doc.data();
			currentNumber = room.currentNumber;

			player = room.players.filter((each, index) => {
				if (each.id === currentUser.uid) {
					playerIndex = index;
				}
				return each.id === currentUser.uid;
			})[0];

			showTicket();
		});

	db.collection('rooms')
		.doc(roomLocalStorage)
		.onSnapshot((doc) => {
			room = doc.data();
			currentNumber = room.currentNumber;

			player = room.players.filter((each, index) => {
				if (each.id === currentUser.uid) {
					playerIndex = index;
				}
				return each.id === currentUser.uid;
			})[0];

			const cloneUiStartBtn = UiStartBtn.cloneNode(true);
			UiStartBtn.parentNode.replaceChild(cloneUiStartBtn, UiStartBtn);

			UiStartBtn = cloneUiStartBtn;

			console.log(cloneUiStartBtn);

			// Say current number
			const currentNumberSpeech = new SpeechSynthesisUtterance(currentNumber);
			currentNumberSpeech.rate = 0.4;

			if (!player) {
				const notification = `
				<div class="notification is-danger is-light">
					<button class="delete"></button>
					<strong>Error:-</strong> An error occoured please join the room again
				</div>
				`;

				UiHandleNotifications(notification);

				localStorage.removeItem('room');

				setTimeout(() => {
					location.href = '/';
				}, 3000);
			}

			// Check room status
			if (room.status === 'waiting') {
				UiRoomStatus.textContent = 'Waiting for players';

				// Hide not needed els
				UiTicketBox.parentElement.parentElement.parentElement.style.display =
					'none';
				UiWinnersList.parentElement.style.display = 'none';

				if (player.isRoomAdmin) {
					cloneUiStartBtn.addEventListener('click', () => {
						const startGame = functions.httpsCallable('startGame');

						const randomNumbers = [];

						while (randomNumbers.length < 100) {
							const newRandomNumber = Math.round(Math.random() * 99) + 1;
							if (randomNumbers.indexOf(newRandomNumber) === -1)
								randomNumbers.push(newRandomNumber);
						}

						cloneUiStartBtn.classList.add('is-loading');

						cloneUiStartBtn.disabled = true;

						startGame({ roomId, randomNumbers }).then((data) => {
							showTicket();
						});
					});
				} else {
					cloneUiStartBtn.disabled = true;
					cloneUiStartBtn.textContent = 'Waiting for admin to start';
				}

				console.log(player.isRoomAdmin);
			} else if (room.status === 'playing') {
				UiRoomStatus.textContent = 'Game in progress';

				UiCurrentNumber.textContent = currentNumber;

				if (room.speakNumber === true) {
					voiceSynt.speak(currentNumberSpeech);
					room.speakNumber = false;
				}

				UiTicketBox.parentElement.parentElement.parentElement.style.display =
					'block';
				UiWinnersList.parentElement.style.display = 'none';

				cloneUiStartBtn.parentElement.style.display = 'none';
				UiWinnersList.parentElement.style.display = 'none';

				// Set score
				UiCurrentScore.textContent = player.score;
			} else if (room.status === 'complete') {
				UiRoomStatus.textContent = 'Game completed';

				UiTicketBox.parentElement.parentElement.parentElement.style.display =
					'none';
				cloneUiStartBtn.parentElement.style.display = 'none';
				UiWinnersList.parentElement.style.display = 'block';
				UiExitBtn.style.display = 'none';

				let html = '';

				room.winners.forEach((each, index) => {
					if (index <= 2) {
						let nanoSec = each.scoreUpdateTime.nanoseconds / 1000000;
						let sec = each.scoreUpdateTime.seconds * 1000;

						let timeInMilliSecs = nanoSec + sec;

						let date = new Date(timeInMilliSecs);

						console.log(date);

						html += `
						<div class="columns is-mobile is-vcentered">
							<div class="column is-one-fifth has-text-centered">
								${index === 0 ? '<i class="fas fa-trophy is-size-1 has-text-primary"></i>' : ''}
								${index === 1 ? '<i class="fas fa-medal is-size-3 has-text-primary"></i>' : ''}
								${
									index === 2
										? '<i class="fas fa-certificate is-size-5 has-text-primary"></i>'
										: ''
								}
							</div>
							<div class="column">
								<h3 class="is-size-4">
									${each.name}
								</h3>
								<p class="is-size-5 has-text-info">Score: ${each.score}</p>
								<p class="is-size-7 has-text-primary">Time: ${date.toLocaleTimeString()}</p>
							</div>
						</div>
						`;
					} else {
						html += `<h3 class="is-size-5">${index + 1}) ${each.name}</h3>`;
					}
				});

				UiWinnersList.innerHTML = html;

				// Say winner
				const winnerSpeech = new SpeechSynthesisUtterance(
					`Congratulations ${room.winners[0].name}, you are the winner. with the score of ${room.winners[0].score}`
				);

				if (room.speakWinner === true) {
					voiceSynt.speak(winnerSpeech);
					room.speakWinner = false;

					docRef.update({
						speakWinner: room.speakWinner,
					});
				}
			}

			// Set room details
			UiRoomName.textContent = room.name;
			UiRoomId.textContent = roomId;

			let UiPlayers = '';

			room.players.forEach((each) => {
				UiPlayers += `
        <div class="columns is-mobile" style="margin-top: 15px;">
					<div class="column">
							<img src="${each.photoURL}" style="width: 35px; border-radius: 50%">
							<p class="is-size-5">${each.name}</p>
							<p class="is-size-7 has-text-primary">ID: ${each.id}</p>
							<p class="is-size-6 has-text-info">Score: ${each.score}</p>
						</div>
          </div>
        </div>
        `;
			});

			UiPlayersList.innerHTML = UiPlayers;

			UiPlayPage.style.display = 'block';

			UiExitBtn.addEventListener('click', () => {
				if (room.status === 'complete') {
					const notification = `
					<div class="notification is-danger is-light">
						<button class="delete"></button>
						<strong>Error:-</strong> Can't exit now
					</div>
					`;

					UiHandleNotifications(notification);

					return;
				} else {
					const newPlayers = room.players.filter((each) => {
						return each.id !== player.id;
					});

					room.players = newPlayers;

					if (room.oldPlayers) {
						room.oldPlayers.push(player);
					} else {
						room.oldPlayers = [player];
					}

					docRef
						.update({
							players: room.players,
							oldPlayers: room.oldPlayers,
							speakNumber: false,
						})
						.then(() => {
							localStorage.removeItem('room');

							location.href = '/';
						});
				}
			});
		});
};

auth.onAuthStateChanged((user) => {
	currentUser = user;
	loadPlayPage();
});
