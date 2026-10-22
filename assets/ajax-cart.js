if ("liquidAjaxCart" in window) {
    var recommendProducts = {},
        recommendResults = false

    let addToCartButton = document.querySelector(".js-btn-cart-combo")
    let addToCartButtonBuyMore = document.querySelectorAll(".js-buy-more-btn")
    var showRecommend = document.querySelector("#cart-recommend")

    if (showRecommend === null) {
        localStorage.removeItem("defaultRecommendSection")
        localStorage.removeItem("recommendSection")
        localStorage.removeItem("deleteRecommendSection")
        localStorage.removeItem("expirationTimeRecommendSection")
    }

    if (addToCartButtonBuyMore) {
        addBuyMore(addToCartButtonBuyMore)
    }

    if (addToCartButton) {
        addComboProducts(addToCartButton)
    }

    liquidAjaxCart.configureCart("updateOnWindowFocus", false)

    liquidAjaxCart.subscribeToCartAjaxRequests(
        (requestState, subscribeToResult) => {
            if (requestState.requestType === "add") {
                subscribeToResult((requestState) => {
                    if (requestState.responseData.ok) {
                        let product_key = requestState.responseData.body.id
                        let product_id = String(
                            requestState.responseData.body.product_id
                        )
                        let product_handle =
                            requestState.responseData.body.handle

                        if (
                            requestState.requestBody &&
                            requestState.requestBody.items
                        ) {
                            console.log("requestState", requestState)
                        } else {
                            recommendProducts[product_key] = product_id
                            buildNotification(requestState)
                            setCookie("cart_recommend", recommendProducts)
                            if (showRecommend) {
                                updateRecommendSection(
                                    product_id,
                                    product_handle
                                )
                            }
                        }
                        const expiration = localStorage.getItem(
                            "expirationTimeRecommendSection"
                        )

                        if (!expiration) {
                            let days = document
                                .querySelector("#cart-recommend")
                                .getAttribute("data-days")
                            setLocalStorageExpiration(days)
                        }
                    }
                })
            }

            if (requestState.requestType === "change") {
                subscribeToResult((requestState) => {
                    if (requestState.responseData?.ok) {
                        let items = requestState.responseData.body.items
                        let cartItems = []
                        if (items.length === 0) {
                            for (const key in recommendProducts) {
                                if (
                                    Object.hasOwnProperty.call(
                                        recommendProducts,
                                        key
                                    )
                                ) {
                                    delete recommendProducts[key]
                                }
                            }
                            deleteCookie("cart_recommend")
                        } else {
                            items.forEach((element) => {
                                cartItems.push(element.id)
                            })

                            for (const key in recommendProducts) {
                                if (
                                    Object.hasOwnProperty.call(
                                        recommendProducts,
                                        key
                                    )
                                ) {
                                    if (!cartItems.includes(+key)) {
                                        delete recommendProducts[key]
                                    }
                                }
                            }
                        }
                        setCookie("cart_recommend", recommendProducts)

                        const value =
                            JSON.parse(
                                localStorage.getItem("removeValueCombo")
                            ) || []
                        if (value) {
                            const countItems = document.querySelectorAll(
                                `[data-value="${value}"]`
                            )
                            removeComboProducts(countItems.length)
                        }
                    }
                })
            }
        }
    )

    liquidAjaxCart.subscribeToCartStateUpdate(async (state, isCartUpdated) => {
        const cartTotalHeader = document.querySelector(".cart-count-ajax-cart")

        if (state.status.cartStateSet && !state.status.requestInProgress) {
            cartTotalHeader.textContent = Shopify.formatMoney(
                state.cart.total_price
            )
            const cartDrawerShipping = document.querySelector(
                ".js-cart-drawer-shipping"
            )
            if (cartDrawerShipping && cartDrawerShipping.isConnected) {
                let currentTotal = state.cart.total_price
                const shippingTotal = document
                    .querySelector(".js-cart-drawer-shipping")
                    .getAttribute("data-total")
                calculateProgress(currentTotal, shippingTotal)
            }

            let getCookieValue = getCookie("cart_recommend")

            if (typeof getCookieValue !== "undefined") {
                if (
                    Object.keys(getCookieValue).length < state.cart.items.length
                ) {
                    refreshCookie(state)
                }
                if (
                    Object.keys(getCookieValue).length !== 0 &&
                    getCookieValue.constructor === Object
                ) {
                    let cartIds = []

                    for (const key in getCookieValue) {
                        if (Object.hasOwnProperty.call(getCookieValue, key)) {
                            const id = getCookieValue[key]
                            cartIds.push(id)
                        }
                    }
                    const existingItems = await getLocalStorageItems()
                    if (existingItems.length > 0) {
                        let strHandles = existingItems.join("=")
                        if (showRecommend) {
                            sentRecommendIds(strHandles)
                        }
                    }
                }
            } else {
                refreshCookie(state)
            }

            if (!isCartUpdated) {
                if (state.previousCart && state.previousCart.items) {
                    const itemsCart = state.cart.items
                    const itemsPreviousCart = state.previousCart.items

                    if (itemsCart.length < itemsPreviousCart.length) {
                        const cartProductIds = itemsCart.map(
                            (item) => item.product_id
                        )
                        const filteredItems = itemsPreviousCart.filter(
                            (item) => !cartProductIds.includes(item.product_id)
                        )
                        if (filteredItems.length > 0) {
                            if (showRecommend) {
                                deleteRecommendSection(
                                    filteredItems[0].product_id,
                                    filteredItems[0].handle
                                )
                            }
                        }
                    }
                }
            }
            const removeButtonCombo =
                document.querySelectorAll(".js-combo-remove")

            if (removeButtonCombo) {
                removeButtonCombo.forEach((button) => {
                    button.addEventListener("click", function (event) {
                        event.preventDefault()
                        let parentGroup = button.closest(".main-combo-item")
                        let parentGroupValue =
                            parentGroup.getAttribute("data-value")

                        let countItems = document.querySelectorAll(
                            `[data-value="${parentGroupValue}"]`
                        )
                        localStorage.setItem(
                            "removeValueCombo",
                            JSON.stringify(parentGroupValue)
                        )
                        removeComboProducts(countItems.length)
                    })
                })
            }
        }
        if (isCartUpdated) {
            window.comboItemsWrapped = false
            groupedComboProducts()
            checkLocalStorageExpiration()
        }
    })

    liquidAjaxCart.cartRequestUpdate()
}

function removeComboProducts(count) {
    if (count === 0) {
        localStorage.removeItem("removeValueCombo")
        //localStorage.removeItem("recommendSection")
        return
    }

    const value = JSON.parse(localStorage.getItem("removeValueCombo")) || []
    const items = document.querySelectorAll(`[data-value="${value}"]`)

    items.forEach((element) => {
        const removeElement = element.querySelector(".js-item-remove")
        setTimeout(() => {
            removeElement.click()
        }, 100)
        const parentElement = element.parentNode
        parentElement.classList.add("js-ajax-cart-form-in-progress")
    })
}

function addBuyMore(addToCartButtonBuyMore) {
    addToCartButtonBuyMore.forEach((button) => {
        button.addEventListener("click", function (event) {
            let mainProductForm = event.target
                .closest(".main-product__content")
                .querySelector(".main-product__form")

            let buyMoreItems = event.target.closest(".js-buy-more-items")

            buyMoreItems.classList.add("js-ajax-cart-form-in-progress")

            let formData = new FormData(mainProductForm)

            let id = formData.get("id")
            let quantity = +buyMoreItems.querySelector(".js-buy-more-item span")
                .textContent

            let formItem = {}

            if (id && quantity) {
                formItem = {
                    id: id,
                    quantity: quantity,
                }
            }

            let items = [formItem]

            let options = {
                lastComplete: (requestState) => {
                    buyMoreItems.classList.remove(
                        "js-ajax-cart-form-in-progress"
                    )
                    if (requestState.requestType === "add") {
                        //console.log("requestType", requestState)

                        buildNotification(requestState)
                        if (requestState.responseData.ok) {
                            let product_id = String(
                                requestState.responseData.body.items[0]
                                    .product_id
                            )
                            let product_handle =
                                requestState.responseData.body.items[0].handle
                            if (showRecommend) {
                                updateRecommendSection(
                                    product_id,
                                    product_handle
                                )
                            }
                        }
                    }
                },
            }

            liquidAjaxCart.cartRequestAdd({ items: items }, options)
        })
    })
}

function addComboProducts(addToCartButton) {
    addToCartButton.addEventListener("click", function (event) {
        let mainProductForm = event.target.closest(".js-main-combo-action")
        let mainProductCombo = event.target.closest(".js-combo-action")

        mainProductForm.classList.add("js-ajax-cart-form-in-progress")

        let formData = new FormData(mainProductForm)
        let otherItems = []
        let propertiesAll = []
        let propertiesNumber = ""
        let id = formData.get("id")
        let quantity = formData.get("quantity")
        let properties = formData.get("properties[ComboDiscount]")

        let otherForms = mainProductCombo.querySelectorAll(
            ".card-product__form"
        )
        propertiesAll.push(id)

        otherForms.forEach(function (form) {
            let otherFormData = new FormData(form)
            let id = otherFormData.get("id")

            if (id) {
                propertiesAll.push(id)
                propertiesNumber += id
            }
        })

        otherForms.forEach(function (form) {
            let otherFormData = new FormData(form)
            let id = otherFormData.get("id")
            let otherItem = {}

            if (id && quantity) {
                otherItem = {
                    id: id,
                    quantity: quantity,
                    properties: {
                        _hiddenCombo: propertiesAll,
                        _hiddenNumber: propertiesNumber,
                    },
                }
                otherItems.push(otherItem)
            }
        })

        let formItem = {}

        if (id && quantity && properties) {
            formItem = {
                id: id,
                quantity: quantity,
                properties: {
                    ComboDiscount: properties,
                    _hiddenCombo: propertiesAll,
                },
            }
        }

        let items = [formItem, ...otherItems]

        let options = {
            lastComplete: (requestState) => {
                let productForm = document.querySelector(
                    ".js-main-combo-action"
                )
                productForm.classList.remove("js-ajax-cart-form-in-progress")
                if (requestState.requestType === "add") {
                    buildNotification(requestState)
                }
            },
        }

        liquidAjaxCart.cartRequestAdd({ items: items }, options)
    })
}

function groupedComboProducts() {
    const comboItems = document.querySelectorAll(".js-combo-item")

    if (!window.comboItemsWrapped) {
        if (comboItems) {
            const groupedItems = {}

            comboItems.forEach((item) => {
                const dataValue = item.getAttribute("data-value")

                if (groupedItems.hasOwnProperty(dataValue)) {
                    groupedItems[dataValue].push(item)
                } else {
                    groupedItems[dataValue] = [item]
                }
            })

            for (const key in groupedItems) {
                const items = groupedItems[key]

                const wrapperDiv = document.createElement("div")
                wrapperDiv.classList.add("ajax-cart__line-item-grouped")

                items.forEach((item) => {
                    wrapperDiv.appendChild(item.cloneNode(true)) // Clone the item before appending
                })

                items.forEach((item) => {
                    const parent = item.parentNode
                    parent.insertBefore(wrapperDiv, item) // Insert the wrapperDiv before the item
                    parent.removeChild(item) // Remove the original item
                })
            }

            window.comboItemsWrapped = true
        }
    }
}

function buildNotification(requestState) {
    fetch(window.Shopify.routes.root + "?section_id=cart-notification")
        .then((response) => response.text())
        .then((text) => {
            if (text) {
                let html = document.createElement("div")
                html.innerHTML = text
                let cartNotification = html.querySelector(
                    ".js-cart-notification"
                )
                document.body.appendChild(cartNotification)
                let modal = document.querySelector(".js-cart-notification")
                modal.classList.add("open")
                document.body.classList.add("overflow-hidden")
                getNotification(requestState)
            }
        })
}

function getNotification(state) {
    let imageSize = document
        .querySelector("#cart-recommend")
        .getAttribute("data-size")
    let modal = document.querySelector(".js-cart-notification")
    trapFocus(modal)
    console.log(state.responseData.body)
    if (state.responseData?.ok) {
        
        if (state.requestBody instanceof FormData) {
            let productTitle = state.responseData.body.product_title;

            if (productTitle.length > 50) {
                productTitle = productTitle.substring(0, 50) + '...';
            }

            modal.querySelector(".js-cart-notification-title").textContent = productTitle
            modal.querySelector(".js-cart-notification-variant-title").textContent =
                state.responseData.body.variant_title
                
            modal.querySelector(".js-cart-notification-image")
                .parentElement.classList.add("media__size--" + imageSize)
            modal.querySelector(".js-cart-notification-image").src =
                state.responseData.body.image

            modal.querySelector(".js-cart-notification-image").alt =
                state.responseData.body.product_title
        } else {
            let item = state.responseData.body.items[0]
            modal.querySelector(".js-cart-notification-title").textContent =
                item.product_title
            modal.querySelector(".js-cart-notification-image")
                .parentElement.classList.add("media__size--" + imageSize)
            modal.querySelector(".js-cart-notification-image").src = item.image

            modal.querySelector(".js-cart-notification-image").alt =
                item.product_title
        }
    } else {
        modal.querySelector(".js-cart-notification-title").textContent =
            state.responseData.body.message +
            " " +
            state.responseData.body.status
        modal.querySelector(".js-cart-notification-image")
            .parentElement.parentElement.remove()
        modal.querySelector(".js-cart-msg").textContent =
            state.responseData.body.description
    }

    modal.classList.add("open")
    document.body.classList.add("overflow-hidden")

    let close = document.querySelectorAll(".js-modal-close")

    close.forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault()
            closeNotification(modal)
        })
    })

    modal.addEventListener("click", (event) => {
        if (event.target == modal) {
            closeNotification(modal)
        }
    })

    modal.addEventListener("keyup", (event) => {
        if (event.code.toUpperCase() === "ESCAPE") {
            closeNotification(modal)
        }
    })
}

function closeNotification(modal) {
    modal.classList.remove("open")
    document.body.classList.remove("overflow-hidden")
    modal.remove()
    removeTrapFocus(modal)
}

function getLocalStorageItems() {
    return new Promise((resolve) => {
        const existingItems =
            JSON.parse(localStorage.getItem("recommendSection")) || []
        const defaultItems =
            JSON.parse(localStorage.getItem("defaultRecommendSection")) || []
        const deleteItems =
            JSON.parse(localStorage.getItem("deleteRecommendSection")) || []

        const updatedItems = existingItems.filter(
            (item) => !defaultItems.includes(item)
        )

        const allItems = updatedItems.concat(defaultItems)

        const updatedAllItems = allItems.filter(
            (item) => !deleteItems.includes(item)
        )

        const finalItems = updatedAllItems.concat(deleteItems)

        resolve(finalItems)
    })
}

function updateLocalStorage(updatedItems) {
    return new Promise((resolve) => {
        localStorage.setItem("recommendSection", JSON.stringify(updatedItems))
        resolve()
    })
}

function updateDeleteLocalStorage(defaultItems) {
    return new Promise((resolve) => {
        localStorage.setItem(
            "deleteRecommendSection",
            JSON.stringify(defaultItems)
        )
        resolve()
    })
}

async function updateRecommendSection(id, handle) {
    const type = document
        .querySelector("#cart-recommend")
        .getAttribute("data-type")
    const response = await fetch(
        `${window.Shopify.routes.root}recommendations/products.json?product_id=${id}&limit=4&intent=${type}`
    )

    const { products } = await response.json()

    const existingItems = await getLocalStorageItems()
    const defaultItems =
        JSON.parse(localStorage.getItem("defaultRecommendSection")) || []

    const handlesToAdd = products
        .map((product) => String(product.handle))
        .filter((handle) => !defaultItems.includes(handle))

    const handlesToRemove = products.map((product) => String(product.handle))

    const updatedItems = existingItems.filter(
        (item) => !handlesToRemove.includes(item)
    )

    updatedItems.unshift(...handlesToAdd)

    const filteredItems = updatedItems.filter(
        (item) => item !== handle && item !== null
    )

    const uniqueItems = [...new Set(filteredItems)]

    await updateLocalStorage(uniqueItems)

    if (uniqueItems.length > 0) {
        let strHandles = uniqueItems.join("=")
        if (showRecommend) {
            sentRecommendIds(strHandles)
        }
    }
}

async function deleteRecommendSection(id, handle) {
    const type = document
        .querySelector("#cart-recommend")
        .getAttribute("data-type")
    const response = await fetch(
        `${window.Shopify.routes.root}recommendations/products.json?product_id=${id}&limit=4&intent=${type}`
    )

    const { products } = await response.json()

    const existingItems = await getLocalStorageItems()

    const defaultItems =
        JSON.parse(localStorage.getItem("defaultRecommendSection")) || []

    const deleteItems =
        JSON.parse(localStorage.getItem("deleteRecommendSection")) || []

    const handlesToRemove = products.map((product) => String(product.handle))

    const updatedItems = existingItems.filter(
        (item) => !handlesToRemove.includes(item)
    )

    const filteredItems = updatedItems.filter(
        (item) => !defaultItems.includes(item)
    )

    const finalItems = [...filteredItems, ...defaultItems]

    const uniqueItems = finalItems.filter(
        (item, index) => finalItems.indexOf(item) === index
    )

    const finalFilteredItems = uniqueItems.filter(
        (item) => item !== handle && item !== null
    )

    if (handle !== null && !deleteItems.includes(handle)) {
        deleteItems.push(handle)
        await updateDeleteLocalStorage(deleteItems)
    }

    await updateLocalStorage(finalFilteredItems)

    if (finalFilteredItems.length > 0) {
        const getAllItems = await getLocalStorageItems()
        let strHandles = getAllItems.join("=")
        if (showRecommend) {
            sentRecommendIds(strHandles)
        }
    }
}

function sentRecommendIds(ids) {
    const cartRecommendREsults = document.querySelector("#cart-recommend")
    const imageSize = document
        .querySelector("#cart-recommend")
        .getAttribute("data-size")

    fetch(
        window.Shopify.routes.root +
            "collections/all?section_id=cart-recommend&id=" +
            encodeURIComponent(ids)
    )
        .then((response) => response.text())
        .then((text) => {
            const html = document.createElement("div")
            html.innerHTML = text
            const cartRecommend = html.querySelector(".js-cart-recommend-block")

            if (cartRecommend && cartRecommend.innerHTML.trim().length) {
                recommendResults = true
                cartRecommendREsults.innerHTML = cartRecommend.innerHTML

                let cartRecommendREsultsItem =
                    cartRecommendREsults.querySelectorAll(
                        ".js-cart-recommend-item"
                    )

                cartRecommendREsultsItem.forEach((item) => {
                    item.querySelector(".card-product__media").classList.add(
                        "media__size--" + imageSize
                    )
                })
                const countDesktop =
                    parseInt(cartRecommendREsults.dataset.countDesktop) || 3
                const countTablet =
                    parseInt(cartRecommendREsults.dataset.countTablet) || 2
                const countMobile =
                    parseInt(cartRecommendREsults.dataset.countMobile) || 2
                const swiper = new Swiper(".js-recommend-swiper", {
                    // Optional parameters
                    loop: false,
                    slidesPerView: countMobile,
                    spaceBetween: 10,
                    // Navigation arrows
                    navigation: {
                        nextEl: ".swiper-button-next",
                        prevEl: ".swiper-button-prev",
                    },
                    breakpoints: {
                        550: {
                            slidesPerView: 2,
                            spaceBetween: 15,
                        },
                        991: {
                            slidesPerView: countTablet,
                            spaceBetween: 20,
                        },
                        1200: {
                            slidesPerView: countDesktop,
                            spaceBetween: 30,
                        },
                    },
                })
            }
        })
}

function refreshCookie(state) {
    if (
        Object.keys(state.cart).length !== 0 &&
        state.cart.constructor === Object
    ) {
        state.cart.items.forEach((element) => {
            let product_key = element.id
            let product_id = String(element.product_id)

            recommendProducts[product_key] = product_id
            setCookie("cart_recommend", recommendProducts)
        })
    }
}

function setCookie(name, json) {
    let cookieValue = ""
    let expire = ""
    let period = ""

    //Specify the cookie name and value
    cookieValue = name + "=" + JSON.stringify(json) + ";"

    //Specify the path to set the cookie
    cookieValue += "path=/ ;"

    //Specify how long you want to keep cookie
    period = 30 //days to store
    expire = new Date()
    expire.setTime(expire.getTime() + 1000 * 3600 * 24 * period)
    expire.toString()
    cookieValue += "expires=" + expire + ";"

    //Set cookie
    document.cookie = cookieValue
}

function deleteCookie(name) {
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
}

function getCookie(name) {
    let cookieValue = ""
    let cookieArray = new Array()

    //Get cookie
    cookieValue = document.cookie

    //Divide the cookie into an array and convert them to JSON
    if (cookieValue) {
        cookieArray = cookieValue.split(";")
        for (const iterator in cookieArray) {
            if (cookieArray[iterator].includes(name)) {
                let data = cookieArray[iterator].split("=")
                return JSON.parse(data[1])
            }
        }
    }
}

function calculateProgress(currentVal, targetVal) {
    let progressBar = document.querySelectorAll(
        ".cart-drawer-shippingThreshold__progress"
    )
    let progressNum = document.querySelectorAll(".cart-drawer-shipping__num")
    let progressOuter = document.querySelectorAll(
        ".cart-drawer-shipping__numOuter"
    )
    let successMsg = document.querySelectorAll(".cart-drawer-shipping__success")
    // calculate how far progress is from the total as a percentage
    let result = Math.round((100 * currentVal) / targetVal)
    progressBar.forEach(function (el) {
        el.setAttribute("style", "width: ".concat(result, "%"))
    })
    // Update the progess text. If threshold is met, show success message
    let newProgressNum = (targetVal - currentVal) / 100
    if (newProgressNum <= 0) {
        successMsg.forEach(function (el) {
            el.style.display = "block"
        })
        progressOuter.forEach(function (el) {
            el.style.display = "none"
        })
        progressNum.forEach(function (el) {
            el.textContent = Shopify.formatMoney(newProgressNum * 100)
        })
    } else {
        successMsg.forEach(function (el) {
            el.style.display = "none"
        })
        progressOuter.forEach(function (el) {
            el.style.display = "block"
        })
        progressNum.forEach(function (el) {
            el.textContent = Shopify.formatMoney(newProgressNum * 100)
        })
    }
}

function checkLocalStorageExpiration() {
    const storedTime = localStorage.getItem("expirationTimeRecommendSection")
    if (storedTime) {
        const currentTime = new Date().getTime()
        if (currentTime > storedTime) {
            localStorage.removeItem("recommendSection")
            localStorage.removeItem("deleteRecommendSection")
            localStorage.removeItem("expirationTimeRecommendSection")
        }
    }
}

function setLocalStorageExpiration(days) {
    const expirationTime = new Date().getTime() + days * 24 * 60 * 60 * 1000
    localStorage.setItem("expirationTimeRecommendSection", expirationTime)
}
