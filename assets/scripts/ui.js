// Content
const headerContent = `
<nav class="navbar container">
  <div class="navbar-brand">
    <a class="navbar-item" href="/">
      <h1 class="is-size-4">Housie</h1>
    </a>

    <a class="navbar-burger burger" data-target="navMenu">
      <span></span>
      <span></span>
      <span></span>
    </a>
  </div>

  <div class="navbar-menu" id="navMenu">
    <div class="navbar-start">
      <a class="navbar-item">About</a>
      <a class="navbar-item">Contact</a>
    </div>
    <div class="navbar-end">
      <div class="navbar-item signout-flex" id="google-signin-button" style="display: none">
        <button class="button">
          <span class="icon">
            <img
              src="/assets/images/google.png"
              alt="Google Logo"
              width="16px"
            />
          </span>
          <span>Sign in</span>
        </button>
      </div>

      <div class="navbar-item has-dropdown is-hoverable">
        <div class="navbar-link is-arrowless is-hidden-touch signin-flex" style="display: none">
          <img class="nav-user-img" src="/assets/images/user.svg" />
        </div>

        <div class="navbar-link is-hidden-desktop signin-flex" style="display: none">
          <p>Account</p>
        </div>

        <div class="navbar-dropdown is-right is-boxed signin-block" style="display: none">
          <p class="navbar-item is-hidden-desktop">
            <img class="nav-user-img" src="/assets/images/user.svg" />
          </p>
          <p class="navbar-item nav-user-name"></p>
          <p class="navbar-item nav-user-email"></p>
          <hr class="navbar-divider" />
          <div class="navbar-item signout-btn" >
            <button class="button is-small is-light is-danger">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>
`;

const footerContent = `
<div class="container has-text-centered">
  <p>
    Made with <i class="fas fa-heart has-text-danger"></i> by
    <a href="https://afnan.dev">Afnan Shaikh</a>
	</p>
	<p style="margin-top:20px"><a target="_blank" href="https://forms.gle/UguQQ9Zo9cc6RTVo7">Report bugs</a> <i class="fas fa-bug has-text-dark"></i></p>
</div>
`;

// Timers
const notificationTimers = [];

// Ui constants
const UiHeader = document.querySelector('header');
const UiFooter = document.querySelector('footer');
const UiBody = document.body;

// Seting header and footer
UiHeader.innerHTML = headerContent;
UiFooter.innerHTML = footerContent;
UiBody.innerHTML += `<div class="notification-container"></div>`;

const UiHandleNotifications = notification => {
	const UiNotificationContainer = document.querySelector('.notification-container');
	UiNotificationContainer.innerHTML += notification;

	const UiAllNotifications = document.querySelectorAll('.notification .delete') || [];

	UiAllNotifications.forEach(each => {
		const notification = each.parentNode;

		each.addEventListener('click', () => {
			notification.remove();
			clearTimeout(notificationTimers[notificationTimers.length - 1]);
		});
	});

	if (UiNotificationContainer.childElementCount > 3) {
		UiNotificationContainer.firstElementChild.remove();
		clearTimeout(notificationTimers[notificationTimers.length - 1]);
	}

	notificationTimers.push(
		setTimeout(() => {
			UiNotificationContainer.firstElementChild.remove();
		}, 3000)
	);
};

const UICloseModalListener = () => {
	const UiAllModals = document.querySelectorAll('.modal');

	// Close modal
	UiAllModals.forEach(each => {
		each.addEventListener('click', evt => {
			const modal = each;

			if (evt.target.getAttribute('modal-function') === 'close') {
				modal.classList.remove('is-active');
			}
		});
	});
};

const UiNavbarToggler = () => {
	const UiNavbarBurger = document.querySelector('.navbar-burger');
	const UiNavbarMenu = document.getElementById(UiNavbarBurger.getAttribute('data-target'));

	if (UiNavbarBurger) {
		UiNavbarBurger.addEventListener('click', () => {
			UiNavbarBurger.classList.toggle('is-active');
			UiNavbarMenu.classList.toggle('is-active');
		});
	}
};

const UiSignInListener = () => {
	const UiGoogleSigninBtn = document.getElementById('google-signin-button');

	UiGoogleSigninBtn.addEventListener('click', () => {
		const provider = new firebase.auth.GoogleAuthProvider();

		firebase
			.auth()
			.signInWithPopup(provider)
			.catch(error => {
				const errorMessage = error.message;

				const notification = `
        <div class="notification is-danger is-light">
          <button class="delete"></button>
          <strong>Error:-</strong> ${errorMessage}
        </div>
        `;

				UiHandleNotifications(notification);
			});
	});
};

const UiSignOutListener = () => {
	const UiSignOutBtn = document.querySelector('.signout-btn');

	UiSignOutBtn.addEventListener('click', () => {
		firebase.auth().signOut();
		localStorage.removeItem('room');
	});
};

const UiLoadMenu = user => {
	const UiSignInFlexEls = document.querySelectorAll('.signin-flex');
	const UiSignInBlockEls = document.querySelectorAll('.signin-block');
	const UiSignOutFlexEls = document.querySelectorAll('.signout-flex');
	const UiSignOutBlockEls = document.querySelectorAll('.signout-block');
	const UiNavUserName = document.querySelector('.nav-user-name');
	const UiNavUserEmail = document.querySelector('.nav-user-email');
	const UiNavUserImg = document.querySelectorAll('.nav-user-img');

	if (user) {
		UiSignInFlexEls.forEach(each => (each.style.display = 'flex'));
		UiSignInBlockEls.forEach(each => (each.style.display = 'block'));
		UiSignOutFlexEls.forEach(each => (each.style.display = 'none'));
		UiSignOutBlockEls.forEach(each => (each.style.display = 'none'));

		UiNavUserName.textContent = user.displayName;
		UiNavUserEmail.textContent = user.email;
		UiNavUserImg.forEach(each => (each.src = user.photoURL));
	} else {
		UiSignInFlexEls.forEach(each => (each.style.display = 'none'));
		UiSignInBlockEls.forEach(each => (each.style.display = 'none'));
		UiSignOutFlexEls.forEach(each => (each.style.display = 'flex'));
		UiSignOutBlockEls.forEach(each => (each.style.display = 'block'));

		UiNavUserName.textContent = null;
		UiNavUserEmail.textContent = null;
		UiNavUserImg.forEach(each => (each.src = '/assets/images/user.svg'));
	}
};

UICloseModalListener();
UiNavbarToggler();
UiSignInListener();
UiSignOutListener();

firebase.auth().onAuthStateChanged(user => {
	UiLoadMenu(user);
});
