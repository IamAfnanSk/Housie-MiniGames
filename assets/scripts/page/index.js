let currentUser = null;

const UiCreateRoomModal = document.getElementById('create-room-modal');
const UiJoinRoomModal = document.getElementById('join-room-modal');

const UiRoomBtnsHandler = () => {
	const UiRoomBtns = document.querySelectorAll('.room-btn');

	UiRoomBtns.forEach((each) => {
		each.addEventListener('click', (evt) => {
			if (currentUser) {
				const action = evt.target.getAttribute('what');

				if (action === 'create') {
					UiCreateRoomModal.classList.add('is-active');
				} else if (action === 'join') {
					UiJoinRoomModal.classList.add('is-active');
				}
			} else {
				const notification = `
          <div class="notification is-danger is-light">
            <button class="delete"></button>
            <strong>Error:-</strong> Sign in to play
          </div>
          `;

				UiHandleNotifications(notification);
			}
		});
	});
};

const UiClearFormError = (el) => {
	const UiHelp = el.parentElement.nextElementSibling;

	el.classList.remove('is-danger');
	UiHelp.classList.remove('is-danger');
	UiHelp.textContent = null;
};

const UiShowFormError = (el, errorMessage) => {
	const UiHelp = el.parentElement.nextElementSibling;

	el.classList.add('is-danger');
	UiHelp.classList.add('is-danger');
	UiHelp.textContent = errorMessage;

	el.focus();
};

const createRoom = (room) => {
	return new Promise((resolve, reject) => {
		db.collection('rooms')
			.add(room)
			.then((roomDetail) => {
				const userDoc = db.collection('users').doc(currentUser.uid);

				userDoc
					.get()
					.then((doc) => {
						if (doc.data() && doc.data().createdRooms) {
							const rooms = doc.data().createdRooms;
							rooms.push(roomDetail.id);
							userDoc
								.update({ createdRooms: rooms })
								.then(() => {
									resolve(roomDetail.id);
								})
								.catch((error) => reject(error));
						} else {
							userDoc
								.set({ createdRooms: [roomDetail.id] })
								.then(() => {
									resolve(roomDetail.id);
								})
								.catch((error) => reject(error));
						}
					})
					.catch((error) => reject(error));
			})
			.catch((error) => reject(error));
	});
};

const makeTicket = () => {
	const ticket = [];

	while (ticket.length < 10) {
		const newRandomNumber = Math.round(Math.random() * 99) + 1;

		if (ticket.indexOf(newRandomNumber) === -1) ticket.push(newRandomNumber);
	}

	return ticket;
};

const UiJoinRoomHandler = () => {
	const UiJoinRoomForm = document.getElementById('join-room-form');
	const UiJoinRoomFormBtn = document.getElementById('join-room-form-btn');

	UiJoinRoomForm.addEventListener('submit', (evt) => {
		evt.preventDefault();

		UiJoinRoomFormBtn.disabled = true;

		const UiIdInput = UiJoinRoomForm['join-room-id'];
		const UiPasswordInput = UiJoinRoomForm['join-room-password'];

		const docRef = db.collection('rooms').doc(UiIdInput.value);

		docRef.get().then((doc) => {
			const room = doc.data();
			const roomId = doc.id;

			if (!room) {
				UiJoinRoomFormBtn.disabled = false;
				const notification = `
          <div class="notification is-danger is-light">
            <button class="delete"></button>
            <strong>Error:-</strong> No such room exist
          </div>
          `;

				UiHandleNotifications(notification);

				return;
			}

			if (room.password === UiPasswordInput.value) {
				const player = room.players.filter((each) => {
					return each.id === currentUser.uid;
				})[0];

				if (!player) {
					if (room.status !== 'waiting') {
						UiJoinRoomFormBtn.disabled = false;
						const notification = `
							<div class="notification is-danger is-light">
								<button class="delete"></button>
								<strong>Error:-</strong> Rooms is already in progress or completed
							</div>
							`;

						UiHandleNotifications(notification);

						return;
					}

					const ticket = { ticket: makeTicket(), id: currentUser.uid };

					const ticketStatus = [];

					for (let i = 0; i < ticket.ticket.length; i++) {
						ticketStatus.push({
							number: ticket.ticket[i],
							status: 'remaining',
						});
					}

					const player = {
						id: currentUser.uid,
						name: currentUser.displayName,
						photoURL: currentUser.photoURL,
						score: 0,
						ticketStatus,
						scoreUpdateTime: new Date(),
					};

					room.players.push(player);

					docRef.update({ players: room.players }).then(() => {
						const userDoc = db.collection('users').doc(currentUser.uid);

						userDoc.get().then((doc) => {
							if (doc.data() && doc.data().joinedRooms) {
								const rooms = doc.data().joinedRooms;

								rooms.push(roomId);

								userDoc
									.update({ joinedRooms: rooms })
									.then(() => {
										localStorage.setItem('room', JSON.stringify(roomId));
										location.href = '/play.html';
									})
									.catch((error) => console.log(error));
							} else {
								userDoc
									.set({ joinedRooms: [roomId] })
									.then(() => {
										localStorage.setItem('room', JSON.stringify(roomId));
										location.href = '/play.html';
									})
									.catch((error) => console.log(error));
							}
						});
					});
				} else {
					localStorage.setItem('room', JSON.stringify(roomId));
					location.href = '/play.html';
				}
			} else {
				const notification = `
          <div class="notification is-danger is-light">
            <button class="delete"></button>
            <strong>Error:-</strong> Wrong password
          </div>
          `;

				UiHandleNotifications(notification);

				UiJoinRoomFormBtn.disabled = false;
			}
		});
	});
};

const UiCreateRoomHandler = () => {
	const UiCreateRoomForm = document.getElementById('create-room-form');
	const UiCreateRoomFormBtn = document.getElementById('create-room-form-btn');

	UiCreateRoomForm.addEventListener('submit', (evt) => {
		evt.preventDefault();

		const UiNameInput = UiCreateRoomForm['create-room-name'];
		const UiPasswordInput = UiCreateRoomForm['create-room-password'];

		// Form validation
		if (UiNameInput.value.length <= 3) {
			UiShowFormError(UiNameInput, 'Name should be atleast 4 char long');
		} else if (UiNameInput.value.length >= 23) {
			UiShowFormError(
				UiNameInput,
				'Name should be no longer than 22 char long'
			);
		} else {
			UiClearFormError(UiNameInput);
			UiCreateRoomFormBtn.disabled = true;

			const ticket = { ticket: makeTicket(), id: currentUser.uid };

			const ticketStatus = [];

			for (let i = 0; i < ticket.ticket.length; i++) {
				ticketStatus.push({
					number: ticket.ticket[i],
					status: 'remaining',
				});
			}

			const player = {
				id: currentUser.uid,
				name: currentUser.displayName,
				photoURL: currentUser.photoURL,
				score: 0,
				ticketStatus,
				isRoomAdmin: true,
				scoreUpdateTime: new Date(),
			};

			const room = {
				name: UiNameInput.value,
				password: UiPasswordInput.value,
				players: [player],
				status: 'waiting',
			};

			createRoom(room)
				.then((response) => {
					UiCreateRoomModal.classList.remove('is-active');
					UiCreateRoomFormBtn.disabled = false;

					UiNameInput.value = null;
					UiPasswordInput.value = null;

					console.log(response);

					localStorage.setItem('room', JSON.stringify(response));

					location.href = '/play.html';
				})
				.catch((error) => {
					console.log(error);

					UiCreateRoomFormBtn.disabled = false;

					UiNameInput.value = null;
					UiPasswordInput.value = null;
				});
		}
	});
};

UiCreateRoomHandler();
UiJoinRoomHandler();

auth.onAuthStateChanged((user) => {
	currentUser = user;
	UiRoomBtnsHandler();
});
