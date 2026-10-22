
class MenuOpen extends HTMLElement {
    constructor() {
        super()
        this.linkToggle = this.querySelector(".js-link-toggle")
        this.linkDdetails = this.querySelector(".js-link-details")
        
        this.addEventListener("keydown", (event) => {
            const condition = event.target.closest(".drawer-submenu--parent")
            console.log("MenuOpen", event.target)
            console.log("condition", condition)
            if ((event.key === "Escape" && event.target.classList.contains("drawer-menu-link")) || (event.key === "Escape" && condition )) {
                this.close()
            }
        })

        this.linkToggle.addEventListener(
            "click",
            ((event) => {
                event.preventDefault()
                this.onSummaryClick(event)
            }).bind(this)
        )

        this.linkToggle.setAttribute("role", "button")
    }

    onSummaryClick(event) {
        event.target.closest("menu-open").classList.contains("open")
            ? this.close()
            : this.open(event)
    }

    onBodyClick(event) {
        if (
            !this.linkDdetails.contains(event.target) &&
            !this.linkToggle.contains(event.target)
        ) {
            this.close(false)
        }
    }

    open(event) {
        this.onBodyClickEvent =
            this.onBodyClickEvent || this.onBodyClick.bind(this)

        event.target.closest("menu-open").classList.add("open")
        document.body.addEventListener("click", this.onBodyClickEvent)
        trapFocus(this.linkDdetails)
    }

    close(focusToggle = true) {
        removeTrapFocus(focusToggle ? this.linkToggle : null)
        this.classList.remove("open")
        document.body.removeEventListener("click", this.onBodyClickEvent)
    }
}
customElements.define("menu-open", MenuOpen)

class SubMenuOpen extends HTMLElement {
    constructor() {
        super()
        this.linkToggle = this.querySelector(".js-link-toggle")
        this.linkDdetails = this.querySelector(".js-link-details")
        this.listDdetails = this.querySelector(".js-link-details ul")

        this.addEventListener("keydown", (event) => {
            console.log("SubMenuOpen", event.target)
            if (event.key === "Escape" &&  (event.target.classList.contains("drawer-submenu--child") || event.target.classList.contains("drawer-submenu--child-link"))) {
                this.close()
            }
        })

        this.linkToggle.addEventListener(
            "click",
            ((event) => {
                event.preventDefault()
                this.onSummaryClick(event)
            }).bind(this)
        )

        this.linkToggle.setAttribute("role", "button")
    }

    onSummaryClick(event) {
        event.target.closest("sub-menu-open").classList.contains("open")
            ? this.close()
            : this.open(event)
    }

    onBodyClick(event) {
        if (
            !this.linkDdetails.contains(event.target) &&
            !this.linkToggle.contains(event.target)
        ) {
            this.close(false)
        }
    }

    open(event) {
        this.onBodyClickEvent =
            this.onBodyClickEvent || this.onBodyClick.bind(this)

        event.target.closest("sub-menu-open").classList.add("open")
        document.body.addEventListener("click", this.onBodyClickEvent)
        setTimeout(() => {
            trapFocus(this.listDdetails)
        }, 100);
        
    }

    close(focusToggle = true) {
        this.classList.remove("open")
        removeTrapFocus(focusToggle ? this.linkToggle : null)
        document.body.removeEventListener("click", this.onBodyClickEvent)
    }
}
customElements.define("sub-menu-open", SubMenuOpen)

class HeaderSearch extends HTMLElement {
    constructor() {
        super()
        this.isOpen = false
        this.route = "/search/suggest"
        this.cachedResults = {}
        this.input = this.querySelector('.search_wrapper input[type="search"]')
        this.dataStyle = this.getAttribute("data-style")
       
        console.log(" this.style",  this.dataStyle)
        this.headerSearchResults = this.querySelector(".results")
        this.headerSearchSuggestions = this.querySelector(".suggestions")
        this.headerSearchFocusable = this.querySelector(
            ".search-modal__focusable"
        )
        this.suggestionButtons = this.querySelectorAll(
            ".search-modal__suggested button"
        )

        this.modal = this.closest(".search-modal")
        this.setupEventListeners()
    }

    setupEventListeners() {
        const form = this.querySelector("form.search")
        form.addEventListener("submit", this.onFormSubmit.bind(this))

        this.input.addEventListener(
            "input",
            this.debounce((event) => {
                this.onChange(event)
            }, 300).bind(this)
        )
        this.input.addEventListener("focus", this.onFocus.bind(this))

        this.suggestionButtons.forEach((button) => {
            button.addEventListener(
                "click",
                ((event) => {
                    event.preventDefault()
                    if (button.dataset.term.length) {
                        this.input.value = button.dataset.term
                        this.updateTermButtonState(button)
                        this.onChange(event)
                    }
                }).bind(this)
            )
        })

        document.addEventListener("details-closed", this.close.bind(this, true))
    }

    disconnectedCallback() {
        document.removeEventListener("details-closed", this.close)
    }

    getQuery() {
        return this.input.value.trim()
    }

    onChange() {
        const searchTerm = this.getQuery()

        if (!searchTerm.length) {
            this.close(true)
            return
        }

        if (searchTerm.length < 3) {
            this.close()
            return
        }

        this.resetSuggestions()
        this.getSearchResults(searchTerm)
    }

    resetSuggestions() {
        this.suggestionButtons.forEach((button) => {
            if (this.getQuery() !== button.dataset.term) {
                button.removeAttribute("disabled")
            }
        })
    }

    onFormSubmit(event) {
        if (!this.getQuery().length) event.preventDefault()
    }

    onFocus() {
        const searchTerm = this.getQuery()
        if (!searchTerm.length) return
        if (searchTerm.length < 3) return
        if (this.getAttribute("results") === "true") {
            this.open()
        } else {
            this.getSearchResults(searchTerm)
        }
    }

    updateTermButtonState(button) {
        if (this.getQuery() === button.dataset.term) {
            button.setAttribute("disabled", true)
        }
    }

    getSearchResults(searchTerm) {
        const queryKey = searchTerm.replace(" ", "-").toLowerCase()
        let sectionStyle = ''
        this.setLiveRegionLoadingState()

        if (this.cachedResults[queryKey]) {
            this.renderSearchResults(this.cachedResults[queryKey])
            return
        }

        if(this.dataStyle == "vertical") {
            sectionStyle = 'header-search-vertical'
        }else {
            sectionStyle = 'header-search'
        }

        fetch(
            `${this.route}?q=${encodeURIComponent(
                searchTerm
            )}&${encodeURIComponent(
                "resources[type]"
            )}=product,article,page&${encodeURIComponent(
                "resources[options][fields]"
            )}=body,product_type,tag,title,variants.barcode,variants.sku,variants.title,vendor,author&section_id=${sectionStyle}`
        )
            .then((response) => {
                if (!response.ok) {
                    var error = new Error(response.status)
                    this.close()
                    throw error
                }

                return response.text()
            })
            .then((text) => {
                let resultsMarkup;

                if(this.dataStyle == "vertical") {
                    resultsMarkup =  new DOMParser()
                    .parseFromString(text, "text/html")
                    .querySelector("#shopify-section-header-search-vertical").innerHTML
                }else {
                    resultsMarkup =  new DOMParser()
                    .parseFromString(text, "text/html")
                    .querySelector("#shopify-section-header-search").innerHTML
                }

                this.cachedResults[queryKey] = resultsMarkup
                this.renderSearchResults(resultsMarkup)
                const resultsMarkups = new DOMParser().parseFromString(
                    text,
                    "text/html"
                )
            })
            .catch((error) => {
                this.close()
                throw error
            })
    }

    setLiveRegionLoadingState() {
        this.setAttribute("loading", true)
    }

    renderSearchResults(resultsMarkup) {
        this.headerSearchResults.innerHTML = resultsMarkup
        this.setAttribute("results", true)

        this.setLiveRegionResults()
        this.open()
    }

    setLiveRegionResults() {
        this.removeAttribute("loading")
    }

    open() {
        this.setAttribute("open", true)
        this.input.setAttribute("aria-expanded", true)
        this.isOpen = true
        this.modal.classList.add("search-modal__full")
        trapFocus(this.headerSearchFocusable, this.input)
    }

    close(clearSearchTerm = false) {
        if (clearSearchTerm) {
            //this.input.value = ""
            this.cachedResults = {}
            this.removeAttribute("results")
            this.resetSuggestions()
        }

        this.input.setAttribute("aria-activedescendant", "")
        this.removeAttribute("open")
        this.input.setAttribute("aria-expanded", false)

        this.isOpen = false
        this.modal.classList.remove("search-modal__full")
    }

    debounce = (fn, wait) => {
        let t
        return (...args) => {
            clearTimeout(t)
            t = setTimeout(() => fn.apply(this, args), wait)
        }
    }
}

customElements.define("header-search", HeaderSearch)

class DetailsOpen extends HTMLElement {
    constructor() {
        super()
        this.detailsContainer = this.querySelector(".js-details")
        this.summaryToggle = this.querySelector(".js-summary")
        this.closeBtn = this.detailsContainer.querySelector(".js-search-drawer-close")

        if (this.closeBtn) {
            this.closeBtn.addEventListener(
                "click",
                ((event) => {
                    this.close()
                })
            )
        }

        this.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.close()
            }
        })

        this.summaryToggle.addEventListener(
            "click",
            ((event) => {
                this.onSummaryClick(event)
            }).bind(this)
        )

        if (this.querySelector(".js-modal-close-btn")) {
            this.querySelector(".js-modal-close-btn").addEventListener(
                "click",
                this.close.bind(this)
            )
        }

        if (this.querySelector(".js-modal-clear-btn")) {
            this.querySelector(".js-modal-clear-btn").addEventListener(
                "click",
                ((event) => {
                    this.detailsContainer.querySelector(".js-modal-input").value = ""
                    this.querySelector("header-search").removeAttribute("open")
                    this.querySelector("header-search").removeAttribute("results")
                    this.querySelectorAll("button[data-term]").forEach(element => {
                        element.removeAttribute("disabled")
                    });
                    
                }).bind(this)
                
            )
        }

        this.summaryToggle.setAttribute("role", "button")
    }

    onSummaryClick(event) {
        event.preventDefault()
        event.target.closest("details-open").classList.contains("open")
            ? this.close()
            : this.open(event)
    }

    onBodyClick(event) {
        if (
            !this.detailsContainer.contains(event.target) &&
            !this.summaryToggle.contains(event.target)
        ) {
            this.close(false)
        }
    }

    open(event) {
        this.onBodyClickEvent =
            this.onBodyClickEvent || this.onBodyClick.bind(this)

        event.target.closest("details-open").classList.add("open")
        document.body.addEventListener("click", this.onBodyClickEvent)
        if (event.target.classList.contains("search-modal__toggle-open")) {
            trapFocus(
                this.detailsContainer,
                this.detailsContainer.querySelector(
                    'input:not([type="hidden"])'
                )
            )
            document.body.classList.toggle("overflow-hidden")
        } else {
            trapFocus(this.detailsContainer)
        }
    }

    close(focusToggle = true) {
        removeTrapFocus(focusToggle ? this.summaryToggle : null)
        if (this.detailsContainer.classList.contains("search-modal")) {
            this.detailsContainer.querySelector(".js-modal-input").value = ""
            this.detailsContainer
                .querySelectorAll(".search-modal__suggested button")
                .forEach((button) => {
                    button.removeAttribute("disabled")
                })
            this.detailsContainer
                .querySelector("header-search")
                .removeAttribute("results")
            this.detailsContainer
                .querySelector("header-search")
                .removeAttribute("open")
            document.body.classList.remove("overflow-hidden")
        }
        this.classList.remove("open")
        document.body.removeEventListener("click", this.onBodyClickEvent)
    }
}

customElements.define("details-open", DetailsOpen)

class DetailsOpenNotify extends DetailsOpen {
    constructor() {
        super()
    }
    onSummaryClick(event) {
        event.preventDefault()
        event.target.closest("details-open-notify").classList.contains("open")
            ? this.close()
            : this.open(event)
    }
    open(event) {
        this.onBodyClickEvent =
            this.onBodyClickEvent || this.onBodyClick.bind(this)

        event.target.closest("details-open-notify").classList.add("open")
        document.body.addEventListener("click", this.onBodyClickEvent)
        if (event.target.classList.contains("js-summary")) {
            trapFocus(this.detailsContainer)
            document.body.classList.toggle("overflow-hidden-notify")
        }
    }
    close(focusToggle = true) {
        removeTrapFocus(focusToggle ? this.summaryToggle : null)
        if (
            this.detailsContainer.classList.contains(
                "card-product__notify-form"
            )
        ) {
            document.body.classList.remove("overflow-hidden-notify")
        }
        this.classList.remove("open")
        document.body.removeEventListener("click", this.onBodyClickEvent)
    }
}

customElements.define("details-open-notify", DetailsOpenNotify)

class Accordion extends HTMLElement {
    constructor() {
        super()

        this.toggle = this.querySelector(".js-accordion-toggle")
        this.content = this.querySelector(".js-accordion-content")

        this.toggle.addEventListener("click", this.onClick.bind(this))
        this.addEventListener("keyup", this.onKeyUp.bind(this))
    }

    onClick(event) {
        event.preventDefault()

        event.target.classList.contains("open") ? this.close() : this.open()
    }

    open() {
        this.toggle.classList.add("open")
        this.content.classList.add("open")

        this.content.style.height = "auto"

        this.content.style.display = "block"
    }
    close() {
        this.toggle.classList.remove("open")
        this.content.classList.remove("open")
        this.content.style.height = "0"
        this.content.style.display = "none"
    }

    onKeyUp(event) {
        console.log(event)
        if (event.code.toUpperCase() !== "ESCAPE") return
        if (
            event.target.classList.contains("js-accordion-toggle") &&
            event.target.classList.contains("open")
        ) {
            this.close()
        }
    }
}

customElements.define("accordion-element", Accordion)

class TabElement extends HTMLElement {
    constructor() {
        super()

        this.tabs = [...this.querySelectorAll(".js-tab")]
        this.tabList = this.querySelector(".js-tablist")
        this.tabPanels = [...this.querySelectorAll(".js-tabpanel")]
        this.mobileOnly = this.dataset.mobileOnly

        this.tabs.forEach((tab) => {
            tab.addEventListener(
                "click",
                ((event) => {
                    this.showTabPanel(event, tab)
                }).bind(this)
            )
        })

        this.tabList.addEventListener("keydown", (e) => {
            this.onKeydown(e)
        })

        if (this.mobileOnly) {
            this.resizeFunction()
            window.addEventListener("resize", this.resizeFunction)
        }
    }

    get autofocus() {
        return this.getAttribute("autofocus")
    }

    showTabPanel = (event, button) => {
        event.preventDefault()

        // close any open tabs and reset tab button
        this.tabPanels.forEach((tabPanel) => {
            tabPanel.classList.add("hidden")
            tabPanel.removeAttribute("tabindex")
            tabPanel.setAttribute("aria-hidden", true)
        })

        this.tabs.forEach((tab) => {
            tab.setAttribute("aria-selected", "false")
            tab.classList.remove("active")
        })

        // find panel to open through the aria-controls of the clicked tab button
        var tabPanelToOpen = document.getElementById(
            button.getAttribute("aria-controls")
        )
        // open selected tab and set focus on content so user bypasses other tabs
        tabPanelToOpen.classList.remove("hidden")
        tabPanelToOpen.setAttribute("tabindex", -1)
        tabPanelToOpen.setAttribute("aria-hidden", false)
        if (!this.autofocus) {
            tabPanelToOpen.focus()
        }

        // highlight open tab button and update aria
        button.setAttribute("aria-selected", "true")
        button.classList.add("active")
    }

    onKeydown = (e) => {
        if (e.keyCode === 39 || e.keyCode === 37) {
            var selected = document.activeElement

            // move right on right arrow
            if (e.keyCode === 39) {
                if (selected.nextElementSibling) {
                    selected.nextElementSibling.click()
                    selected.nextElementSibling.focus()
                }

                // move left on left arrow
            } else if (e.keyCode === 37) {
                if (selected.previousElementSibling) {
                    selected.previousElementSibling.click()
                    selected.previousElementSibling.focus()
                }
            }
        }
    }

    resizeFunction = () => {
        const mobile = window.matchMedia("(max-width: 767px)").matches

        // On desktop, hide the tab triggers, since they're redundant - all tab panels are visible. On mobile, add the event trigger
        mobile
            ? (this.tabList.classList.remove("hidden"),
              this.tabList.setAttribute("aria-hidden", false))
            : (this.tabList.classList.add("hidden"),
              this.tabList.setAttribute("aria-hidden", true))

        // On desktop, show all tab panels and remove aria attributes. On mobile, hide all tab panels and then show the first one, and add back aria attributes
        this.tabPanels.forEach((tabPanel, i) => {
            const tabId = tabPanel.id.split("-")[0]
            mobile
                ? (tabPanel.classList.add("hidden"),
                  tabPanel.setAttribute("aria-hidden", true),
                  i == 0 && tabPanel.classList.remove("hidden"),
                  i == 0 && tabPanel.setAttribute("aria-hidden", false),
                  tabPanel.setAttribute("role", "tabpanel"),
                  tabPanel.setAttribute("aria-labelledby", `${tabId}-tab`))
                : (tabPanel.classList.remove("hidden"),
                  tabPanel.setAttribute("aria-hidden", false),
                  tabPanel.removeAttribute("role"),
                  tabPanel.removeAttribute("aria-labelledby"))
        })

        // The tab triggers are hidden on desktop, so nothing needs to happen. On mobile, hide all tab triggers and then show the first one
        this.tabs.forEach((tab, i) => {
            if (mobile) {
                tab.classList.remove("active")
                i == 0 && tab.classList.add("active")
            }
        })
    }
}

customElements.define("tab-element", TabElement)
