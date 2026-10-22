document.addEventListener('DOMContentLoaded', function(){

    function toggleClass() {
        document.addEventListener('click', function(e) {
            // Ищем ближайший элемент с атрибутом data-ajax-cart-toggle-class-button
            const button = e.target.closest('[data-ajax-cart-toggle-class-button]');
            if (button) {
                e.preventDefault();
                const attrValue = button.getAttribute('data-ajax-cart-toggle-class-button');
                const [className, action] = attrValue.split('|').map(s => s.trim());
                // Переключаем класс у body
                if (action === 'remove') {
                    document.body.classList.remove(className);
                } else {
                    document.body.classList.toggle(className);
                }
            }
        });
    }

    function calculateProgress(currentVal, targetVal) {
        // Получаем элементы один раз, используя деструктуризацию
        const progressBar = document.querySelectorAll(".cart-drawer-shippingThreshold__progress");
        const progressNum = document.querySelectorAll(".cart-drawer-shipping__num");
        const progressOuter = document.querySelectorAll(".cart-drawer-shipping__numOuter");
        const successMsg = document.querySelectorAll(".cart-drawer-shipping__success");
        const thresholdBadge = document.querySelectorAll(".js-cart-threshold-badge");
    
        // Рассчитываем процент прогресса и ограничиваем до 100%
        let result = Math.round((100 * currentVal) / targetVal);
        result = Math.min(result, 100);
        const newProgressNum = (targetVal - currentVal) / 100;
    
        // Обновляем прогрессбар
        progressBar.forEach(el => el.style.width = `${result}%`);
    
        // Обновляем значок порога и применяем отрицательный правый маржин, если необходимо
        thresholdBadge.forEach(el => {
            el.textContent = `${result}%`;
            if (result < 40) {
                el.style.marginRight = '-40px';
            } else {
                el.style.marginRight = '0';
            }
        });
    
        // Обновляем текст прогресса и отображаем сообщения об успехе
        if (newProgressNum <= 0) {
            successMsg.forEach(el => el.style.display = "block");
            progressOuter.forEach(el => el.style.display = "none");
            progressNum.forEach(el => el.textContent = Shopify.formatMoney(0));
        } else {
            successMsg.forEach(el => el.style.display = "none");
            progressOuter.forEach(el => el.style.display = "block");
            progressNum.forEach(el => el.textContent = Shopify.formatMoney(newProgressNum * 100));
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
    
    
    
    document.addEventListener("liquid-ajax-cart:request-start", function(event) {
        const {requestState} = event.detail;
        // Print the requestState before the request is performed
        console.log(requestState);
    });

    // Listen for the "liquid-ajax-cart:request-end" event which is fired
    // after a Shopify Cart API Ajax request is performed
    document.addEventListener('liquid-ajax-cart:request-end', event => {
        const {requestState} = event.detail;
        console.log("requestState",event.detail.cart.total_price)

        const cartDrawerShipping = document.querySelector(
            ".js-cart-drawer-shipping"
        )
        if (cartDrawerShipping && cartDrawerShipping.isConnected) {
            let currentTotal = event.detail.cart.total_price
            const shippingTotal = document
                .querySelector(".js-cart-drawer-shipping")
                .getAttribute("data-total")
            calculateProgress(currentTotal, shippingTotal)
        }
    
        // If the "add to cart" request is successful
        if (requestState.requestType === 'add' && requestState.responseData?.ok) {
    
            // Add the CSS class to the "body" tag
            //document.body.classList.add('js-show-ajax-cart');
            buildNotification(requestState)
        }
    });

    function runWhenInit() {
        console.log("The current cart state is: ", window.liquidAjaxCart.cart);
        toggleClass()
        const cartDrawerShipping = document.querySelector(
            ".js-cart-drawer-shipping"
        )
        if (cartDrawerShipping && cartDrawerShipping.isConnected) {
            let currentTotal = window.liquidAjaxCart.cart.total_price
            const shippingTotal = document
                .querySelector(".js-cart-drawer-shipping")
                .getAttribute("data-total")
            calculateProgress(currentTotal, shippingTotal)
        }
    }
      
    if (window.liquidAjaxCart?.init) {
    // if Liquid Ajax Cart is already initialized
    runWhenInit();
    } else {
    // wait for Liquid Ajax Cart to be initialized
    document.addEventListener("liquid-ajax-cart:init", runWhenInit);
    }
});