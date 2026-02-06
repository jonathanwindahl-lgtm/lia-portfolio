const apiURL = "https://6915a1dc84e8bd126afabb7f.mockapi.io/Products"
let productsList = []

fetch(apiURL)
.then(res => res.json())
.then(products => {
productsList = products
initPage()
})

function initPage () {
cartCount()

if(document.querySelector(".product-container")) {
showProducts(productsList)
search()
filters()
}

if (document.querySelector("#checkout-page")) {
  const cart = getCart()
  displayCartItems(cart,productsList)
  calculateTotal(cart, productsList)
  discount()
}

if  (document.querySelector("#single-product")) {
  singleProduct()
  }
}

function showProducts (products) {
  const container = document.querySelector(".product-container")
  container.innerHTML = `
    <section class="produkt-grid">
      ${products.map(p => `
        <article>
        <a href="produkt.html?id=${p.id}">
        <img src="${p.imageUrl}" alt="${p.description}">
        </a>
        <h3>${p.description}</h3>
        <p>${p.price} kr</p>
        </article>
      `).join("")}
      </section>
    `
  }

function search () {
  const search = document.getElementById("sitesearch")

  search.addEventListener("input", e => {
    const value = e.target.value.toLowerCase()
    const filtered = productsList.filter(p =>
      p.description.toLowerCase().includes(value)
    )
    showProducts(filtered)
  })
}

function filters() {
  const selects = [
    "filter-style",
    "filter-damping",
    "filter-color",
    "filter-price"
  ].map(id => document.getElementById(id))

  selects.forEach(select => {
    if (select) select.addEventListener("change", applyFilters)
  })
}

function applyFilters () {
  const style = document.getElementById("filter-style").value
  const damping = document.getElementById("filter-damping").value
  const color = document.getElementById("filter-color").value
  const price = document.getElementById("filter-price").value

  let result = productsList.filter(p =>
    (!style || p.style === style) &&
    (!damping || p.damping === damping) &&
    (!color || p.color === color)
  )

  const priceRange = {
    cheaper: [500,1000],
    cheap: [1000,1500],
    average: [1500, 2000],
    expensive: [2000, 2500]
  }

  if (price) {

  const [min, max] = priceRange[price]
  result = result.filter(p => p.price >= min && p.price <= max)
  }
  showProducts(result)
}
function singleProduct() {
  const id = new URLSearchParams(location.search).get("id")
  const product = productsList.find(p => p.id === id)

  document.querySelector("#product-image").src = product.imageUrl
  document.querySelector("#product-title").textContent = product.description
  document.querySelector("#product-price").textContent = product.price + " kr"
  document.querySelector("#product-description").textContent = product.longDescription || ""

  const btn = document.getElementById("addToCartBtn")
  if (btn) btn.addEventListener("click", () => addToCart(id))
}

function getCart () {
  return JSON.parse(localStorage.getItem("cart")) || []
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart))
}

function addToCart(productId) {
  const id = Number(productId)
  const size = document.getElementById("size").value
  const sizeError = document.getElementById("sizeError")

  if (!size) {
    sizeError.textContent = "Du måste välja en storlek"
    return
  }

  const cart = getCart()

  let item = cart.find(i => i.id == id &&  i.size === size)

  if (item) {
    item.quantity++
  }else{
    cart.push({
      id,
      size,
      quantity: 1
    })
  }
  updateCart(cart)
}

function updateCart(cart) {
  saveCart(cart)
  displayCartItems(cart, productsList)
  calculateTotal(cart, productsList)
  cartCount()
}

function cartCount () {
  const cart = getCart()
  const count = cart.reduce((sum, i) => sum + i.quantity, 0)
  const el = document.getElementById("cart-count")

  if (el) el.textContent = count
}


function displayCartItems(cart, products) {
  const container = document.getElementById("cartItems")
  if (!container) return

  if (cart.length === 0) {
    container.innerHTML = "<p>Din varukorg är tom.</p>"
    return
  }

  container.innerHTML = `
    <section class="cart-list">
      ${cart.map(item => {
        const p = products.find(prod => prod.id == item.id)
        return `
          <article class="cart-item">
            <img src="${p.imageUrl}" width="100">
            <div>
              <h3>${p.description}</h3>
              <p>Pris: ${p.price} kr</p>
              <p> Storlek: ${item.size}</p>
              <div class="quantity-buttons">
                <button class="minus" data-id="${item.id}" data-size="${item.size}">-</button>
                <span>${item.quantity}</span>
                <button class="plus" data-id="${item.id}" data-size="${item.size}">+</button>
              </div>
            </div>
          </article>
        `
      }).join("")}
    </section>
  `

  quantityButtons(cart)
}


function quantityButtons(cart) {
  document.querySelectorAll(".plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id)
      const size = btn.dataset.size

      const item = cart.find(i => i.id == id &&  i.size === size)
      item.quantity++
      updateCart(cart)
    })
  })

  document.querySelectorAll(".minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id)
      const size = btn.dataset.size

      const item = cart.find(i => i.id == id &&  i.size === size)

      if (item.quantity > 1) {
        item.quantity--

      }else {
      const index = cart.indexOf (item)
      cart.splice(index, 1)
      }
      updateCart(cart)
    })
  })
}

function calculateShipping (totalPrice) {

const freeShipping = 1000
const shippingFee = 49

if (totalPrice >= freeShipping) {

  return 0
}

return shippingFee
}

function calculateTotal(cart, products) {
  let total = 0

  cart.forEach(item => {
    const p = products.find(prod => prod.id == item.id)
    total += p.price * item.quantity
  })

  const shipping = calculateShipping(total)

  const totalCost = document.getElementById("totalCost")
  const shippingCost = document.getElementById("shippingCost")
  const totalPrice = document.getElementById("totalPrice")

  if (totalCost) totalCost.textContent = `Varor: ${total} kr`
  if (shippingCost) shippingCost.textContent = `Frakt: ${shipping} kr`
  if (totalPrice) totalPrice.textContent = `Att betala: ${total + shipping} kr`
}

const emptyBtn = document.getElementById("emptyCart")
if (emptyBtn) {
  emptyBtn.addEventListener("click", () => {
    localStorage.removeItem("cart")
    const cart = []
    cartCount()
    displayCartItems([], productsList)
    calculateTotal(cart, productsList)
  })
}

function showError(element, message) {
  element.textContent = message
  element.style.display = "block"
  element.style.color = "red"
}

function hideError(element) {
  element.style.display ="none"
}

const validEmail = email =>
/^\S+@\S+\.\S+$/.test(email)

const validPassword = pwd =>
/^[A-Za-z0-9]{8,}$/.test(pwd)


function createAccount () {
const email = document.getElementById("email").value
const password = document.getElementById("password").value

const emailError = document.getElementById("emailError")
const passwordError = document.getElementById("passwordError")
const msg = document.getElementById("message")

let valid = true

if (!email) {
  showError(emailError, "Ange en mejladress")
  valid = false
} else if (!validEmail(email)) {
  showError(emailError, "Ange en giltlig mejladress")
}else {
 hideError(emailError)
}

if (!validPassword(password)) {
showError(passwordError, "Lösenordet måste vara minst 8 ")
valid = false
} else {
hideError(passwordError)
}

if (!valid) return

msg.textContent = "Konto skapat"
msg.style.color = "green"

const user = {email, password}
localStorage.setItem("user",JSON.stringify(user))

 setTimeout(() => {
      window.location.href = "login.html"
    }, 3000)
}

function login() {
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const msg = document.getElementById("message")

  const user = JSON.parse(localStorage.getItem("user"))


  if (!user) {
    msg.textContent = "Inget konto hittades!"
    msg.style.color = "red"
    return
  }

  const correct =
    email === user.email &&
    password === user.password

  if (correct) {
    localStorage.setItem("isLoggedIn", true)

    msg.textContent = "Inloggning lyckades!"
    msg.style.color = "green"

    setTimeout(() => {
      window.location.href = "index.html"
    }, 3000)
  } else {
    msg.textContent = "Fel användarnamn eller lösenord!"
    msg.style.color = "red"
  }
}

function discount() {
    if (JSON.parse(localStorage.getItem("isLoggedIn"))) {
    document.getElementById("discount-section").style.display = "block"
  }
  const btn = document.getElementById("discountBtn")
   if (btn) {
    btn.addEventListener("click", () => {
    const code = document.getElementById("discountInput").value
    const msg = document.getElementById("discountMessage")

    let total = parseFloat(document.getElementById("totalPrice").textContent.replace(/[^\d]/g, ""))

    if (code === "VIP25") {
      const newPrice = (total * 0.75).toFixed(2)
      document.getElementById("totalPrice").textContent = newPrice + " kr"
      msg.textContent = "Rabattkod använd!"
    } else {
      msg.textContent = "Fel rabattkod."
    }
  })
}
}
