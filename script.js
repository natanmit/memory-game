const HarryBtn = document.getElementById('Harry Potter')
const DogsBtn = document.getElementById('Dogs')

const harryPotter = 'https://hp-api.onrender.com/api/characters'
const dogs = 'https://dog.ceo/api/breeds/image/random'

const selectors = {
    boardContainer: document.querySelector('.board-container'),
    board: document.querySelector('.board'),
    moves: document.querySelector('.moves'),
    timer: document.querySelector('.timer'),
    start: document.querySelector('button'),
    win: document.querySelector('.win')
}


const state = {
    gameStarted: false,
    flippedCards: 0,
    totalFlips: 0,
    totalTime: 0,
    loop: null
}

const shuffle = array => {
    const clonedArray = [...array]

    for (let i = clonedArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1))
        const original = clonedArray[i]

        clonedArray[i] = clonedArray[randomIndex]
        clonedArray[randomIndex] = original
    }
    return clonedArray
}

const pickRandom = (array, items) => {
    const clonedArray = [...array]
    const randomPicks = []

    for (let i = 0; i < items; i++) {
        const randomIndex = Math.floor(Math.random() * clonedArray.length)

        randomPicks.push(clonedArray[randomIndex])
        clonedArray.splice(randomIndex, 1)
    }
    return randomPicks
}

const generateGame = (gameChoice) => {
    const dimensions = selectors.board.getAttribute('data-dimension')

    if (dimensions % 2 !== 0) {
        throw new Error("The dimension of the board must be an even number.")
    }

    if (gameChoice.includes('hp')) {
        fetchHarryPotter(gameChoice)
            .then(data => {
                const cards = CreateCard(dimensions, data)
                const parser = new DOMParser().parseFromString(cards, 'text/html')
                selectors.board.replaceWith(parser.querySelector('.board'))

            })
            .catch(error => console.log(error))
    } else if (gameChoice.includes('dog')) {
        fetchDogs(gameChoice)
            .then(data => {
                const cards = CreateCard(dimensions, data)
                const parser = new DOMParser().parseFromString(cards, 'text/html')
                selectors.board.replaceWith(parser.querySelector('.board'))

            })
            .catch(error => console.log(error))
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function fetchHarryPotter(gameChoice) {
    return fetch(gameChoice)
        .then(response => response.json())
        .then(data => {
            const dataImages = data.map(image => image.image)
            const slicedImages = dataImages.slice(0, 5)
            const joindCards = [...slicedImages, ...slicedImages]
            return shuffleArray(joindCards)
        })
        .catch(err => console.error(err))
}

function fetchDogs(gameChoice) {
    const dogs = [];
    const fetchPromises = [];

    for (let i = 0; i < 5; i++) {
        const fetchPromise = fetch(gameChoice)
            .then(response => response.json())
            .then(data => {
                dogs.push(data.message);
            })
            .catch(err => console.error(err));
        fetchPromises.push(fetchPromise);
    }

    return Promise.all(fetchPromises)
        .then(() => {
            const joinedCards = [...dogs, ...dogs];
            return shuffleArray(joinedCards);
        })
        .catch(err => {
            console.error("Error while fetching dogs:", err);
            throw err; // Rethrow the error to propagate it
        });
}

const startGame = () => {
    state.gameStarted = true
    selectors.start.classList.add('disabled')
    state.loop = setInterval(() => {
        state.totalTime++
        selectors.moves.innerText = `${state.totalFlips} moves`
        selectors.timer.innerText = `Time: ${state.totalTime} sec`
    }, 1000)
}

function CreateCard(dimensions, shuffleCards) {
    const cards = `
    <div class="board" style="grid-template-columns: repeat(${dimensions}, auto)">
        ${shuffleCards.map(item => `
            <div class="card">
                <div class="card-front"></div>
                <div class="card-back" style="background-position: center; background-repeat: no-repeat; background-size: contain; background-image: url('${item}')" 
                background-repeat: no-repeat;
                background-size: contain;>
                <p style="visibility: hidden;"> ${item}</p>
                </div>
            </div>
        `).join('')}
   </div>
`
    return cards
}


const flipBackCards = () => {
    document.querySelectorAll('.card:not(.matched)').forEach(card => {
        card.classList.remove('flipped')
    })

    state.flippedCards = 0
}

const flipCard = card => {
    state.flippedCards++
    state.totalFlips++

    if (!state.gameStarted) {
        startGame()
    }

    if (state.flippedCards <= 2) {
        card.classList.add('flipped')
    }

    if (state.flippedCards === 2) {
        const flippedCards = document.querySelectorAll('.flipped:not(.matched)')
        if (flippedCards[0].textContent === flippedCards[1].textContent) {
            flippedCards[0].classList.add('matched')
            flippedCards[1].classList.add('matched')
        }
        setTimeout(() => {
            flipBackCards()
        }, 1000)
    }

    if (!document.querySelectorAll('.card:not(.flipped)').length) {
        setTimeout(() => {
            selectors.boardContainer.classList.add('flipped')
            selectors.win.innerHTML = `
                <span class="win-text">
                    You won!!<br />
                    with <span class="highlight">${state.totalFlips}</span> moves<br />
                    under <span class="highlight">${state.totalTime}</span> seconds
                </span>
            `

            clearInterval(state.loop)
        }, 1000)
    }
}

const attachEventListeners = () => {
    document.addEventListener('click', event => {
        const eventTarget = event.target
        const eventParent = eventTarget.parentElement

        if (eventTarget.className.includes('card') && !eventParent.className.includes('flipped')) {
            flipCard(eventParent)
        } else if (eventTarget.nodeName === 'BUTTON' && !eventTarget.className.includes('disabled')) {
            startGame()
        }
    })
}


HarryBtn.addEventListener('click', () => generateGame(harryPotter))
DogsBtn.addEventListener('click', () => generateGame(dogs))

attachEventListeners()