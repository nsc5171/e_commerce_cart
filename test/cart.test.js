'use strict';
const axios = require('axios');
const url = "http://localhost:3000/api"
let accessToken;

let testMeta = [
    {
        name: "Item discounts - A(3) and B(2)",
        reqBody: {
            "items": [
                {
                    "itemType": "A",
                    "quantity": 3
                },
                {
                    "itemType": "B",
                    "quantity": 2
                }
            ]
        },
        expectations: {
            MRP: 130,
            cartDiscount: 0,
            itemsDiscount: 20
        }
    },
    {
        name: "No promotions applicable case - E(1)",
        reqBody: {
            "items": [
                {
                    "itemType": "E",
                    "quantity": 1
                }
            ]
        },
        expectations: {
            MRP: 15,
            cartDiscount: 0,
            itemsDiscount: 0
        }
    },
    {
        name: "New year sale - E(2)",
        reqBody: {
            "items": [
                {
                    "itemType": "E",
                    "quantity": 2
                }
            ]
        },
        expectations: {
            MRP: 30,
            cartDiscount: 0,
            itemsDiscount: 5
        }
    },
    {
        name: "New year and clearance sales - E(3)",
        reqBody: {
            "items": [
                {
                    "itemType": "E",
                    "quantity": 3
                }
            ]
        },
        expectations: {
            MRP: 45,
            cartDiscount: 0,
            itemsDiscount: 22.5
        }
    },
    {
        name: "New year and clearance sales - E(10)",
        reqBody: {
            "items": [
                {
                    "itemType": "E",
                    "quantity": 10
                }
            ]
        },
        expectations: {
            MRP: 150,
            cartDiscount: 0,
            itemsDiscount: 85
        }
    },
    {
        name: "New year sale - A(20) and cart promotion (>150)",
        reqBody: {
            "items": [
                {
                    "itemType": "A",
                    "quantity": 20
                }
            ]
        },
        expectations: {
            MRP: 600,
            cartDiscount: 20,
            itemsDiscount: 100
        }
    },
    {
        name: "Clearance sale - B(30) but not cart promotion (>150)",
        reqBody: {
            "items": [
                {
                    "itemType": "B",
                    "quantity": 30
                }
            ]
        },
        expectations: {
            MRP: 600,
            cartDiscount: 0,
            itemsDiscount: 75
        }
    }
]

describe("Cart price calculation tests", () => {
    beforeAll(() => {
        return axios.post(url + '/Users/login', {
            "username": "admin",
            "password": "com_cart_admin"
        }, { headers: { 'Content-Type': 'application/json' } }).then(resp => {
            accessToken = resp.data.id;
        }).catch(errHandler)
    });

    testMeta.forEach(({ name, reqBody, expectations }) => {
        test(name, () => {
            requestHelper(reqBody).then(resp => {
                let body = resp.data;
                Object.entries(expectations).forEach(([key, val]) => {
                    expect(body[key]).toBe(val);
                })
            }).catch(errHandler)
        })
    });
});

function requestHelper(reqBody) {
    return axios.put(url + '/Carts/calculateCartPricing', reqBody, {
        headers: { 'Content-Type': 'application/json' },
        params: { access_token: accessToken }
    });
}

function errHandler(err) {
    console.error(err);
}