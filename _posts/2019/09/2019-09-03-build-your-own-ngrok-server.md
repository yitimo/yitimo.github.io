---
layout: post
title:  自己搭建ngrok服务器代理本地服务
date:   2019-09-03 15:32:13 +0800
author: yitimo
categories: javascript
tags: ["ngrok", "nginx"]
keywords:
- ngrok,
- nginx,
description: 自己搭建ngrok服务器代理本地服务
---

## ngrok做了什么

正常的网络拓扑下，一般通过 ``255.255.255.0`` 掩码区分不同网段，即IP的前三段都相同视为同一网段，若想要让两个网段通信，则需要通过路由器来完成，通过在路由器中配置路由表，使两个不同网段的IP建立映射关系。

一般我们请求某个服务器地址时，显然本地局域网地址和远程服务器地址不在同一网段，我们是本地通过连接到本地网关，然后连接至互联网，然后连接至远程服务器。

但是反过来就不行了，想象一下远程服务器该如何请求到一个本地的局域网地址？

答案是NAT技术。

个人版的NAT技术的粗暴理解：类比一下本地请求远程时，客户端是如何接收到远程服务器响应的。对于远程服务器来说，其实只知道有另一个外网地址请求了自己，并给了他响应，这个外网地址即本地网关的外网地址，再由本地网关将这个来自服务器的响应精准的返回给本地地址。即本地网关把一个来自外网服务器的响应转发给了一个本地地址。

所以有哪些简单的方法可以做到：在本地运行一个站点，请求一个外网地址访问到这个站点？

1. 直接给本地分配一个外网IP
2. 通过一个连接至外网的路由器进行NAT
3. 通过ngrok

ngrok的内部做法和NAT不一样(目测其建立了一个C/S连接来实时监听并转发请求，而NAT只需一张映射表被动的转发请求)，但做的事情类似，远程服务器请求的是我们拥有外网地址的网关(运行了ngrok server的个人服务器)，然后由 ngrock server 来映射至建立好连接的本地 ngrok client，并根据 ngrok client 配置好的规则转发至特定端口。总结：整个ngrok(包括运行在本地的client)都属于负责转发请求的网关，这整个过程成为内网穿透。

## ngrok能做什么

- 本地调试微信授权
- 本地调试 github hook
- 任何需要接收外网回调的调试场景

## 使用ngrok需要自己准备什么

- 外网服务器
- 已备案域名
- 想要在本地调试开放平台回调等
- 感到ngrok官方自带的不够用

## 使用ngrok需要如何配置

- git clone 源码
- 生成 根证书
- 编译服务端 用生成的根证书
- 编译客户端 用生成的根证书 选实际客户端的平台比如mac
- 服务端配置 服务器http端口 服务器https端口 ngrok服务运行端口
- 云服务器存在安全组记得放开ngrok的服务器端口 比如4443
- 客户端配置 本地端口 远程服务器端口
- nginx配置 隐藏远程端口而使用泛域名

*此文章还在更新中*


getters.js

/**
     * 还有优惠可叠加使用
     * 有会员卡 且 可选的都 未选中
     * 或
     * 有优惠券 且 可选的未 都选中
     */
    hasUnChosenPomotion(state, getters) {
        const { cardPromotionList, mcCoupons } = getters
        return (cardPromotionList.length && cardPromotionList.all(card => card.selected === false && card.canUse))
            || mcCoupons.some(coupon => coupon.selected === false && coupon.canUse)
    },


index.vue

changeCardPromotion(item) {
            const { cardId, type } = item
            this.$store.commit('updatePointsPayFee', 0) // 每次修改优惠前，要清除积分抵现状态

            const param = {
                cardId,
                singleExchangeSelected: false,
                mcPromotionSelected: false,
                shouldReComputeKouBeiSelected: false,
                memberPointsSelected: true,
                cardPaySelected: true,
                cardPays: [],
                marketCenterPromotions: [],
            }

            const index = this.selectedCardPromotions.findIndex(e => e.cardId === cardId)
            if (index > -1) {
                param.cardId = ''
            } else {
                // 如果之前选中的卡是 商城卡
                // FIXME: 当前 个人优惠里 是否有 商城优惠card 选中, 那么取消它
                const hasMallCardInSingle = this.selectedCardPromotions.filter(o => o.type === 121 && o.multiTag === 0).length > 0
                if (hasMallCardInSingle) {
                    param.mallCardId = ''
                }

                // FIXME: 如果是 商圈卡 则使用 mallCardId
                if (type === 121) {
                    param.cardId = ''
                    param.mallCardId = cardId
                }
            }
            // TODO: [优惠复用] 这里的param需要支持多参数
            this.requestTradeBill(param)
        },


actions/index.js

/**
 * 选则券 TODO: [优惠复用]
 */
function toggleCoupon({
    dispatch, commit, getters,
    state,
}, id) {
    const { choseCoupon = [] } = state
    // 兼容原单选逻辑
    const chosenCouponList = typeof choseCoupon === 'string' ? [choseCoupon] : [].concat(choseCoupon)
    // 开关选中优惠券id
    const index = chosenCouponList.indexOf(id)
    if (index >= 0) {
        chosenCouponList.splice(index)
    } else {
        chosenCouponList.push(id)
    }
    commit('updateCoupons', chosenCouponList)
    const { currentSelectedPromotions } = getters
    commit('updateFormParams', {
        marketCenterPromotions: currentSelectedPromotions,
        mcPromotionSelected: !!chosenCouponList.length,
    })

    dispatch('requestTradeBill')
}

function clearPromotions({ dispatch, commit }) {
    commit('updateFormParams', {
        cardId: '',
        marketCenterPromotions: [],
        mcPromotionSelected: false,
        shouldReComputeKouBeiSelected: false,
        singleExchangeSelected: false,

        memberPointsSelected: true,
        cardPaySelected: true,
        cardPays: [],
    })
    commit('updateCoupons', [])
    dispatch('requestTradeBill')
}

// 此为旧的改优惠券方法 不支持优惠复用
    changeCoupon,
    // 支持多选的改优惠券方法
    toggleCoupon,

getters.js

currentSelectedPromotions(state, getters) {
        const {
            choseCoupon,
            // choseExchanges
        } = state
        const {
            mcCoupons,
            // mcExchanges,
        } = getters

        // 优惠复用后choseCoupon数组
        const selectedCoupon = mcCoupons.filter(coupon => choseCoupon.indexOf(coupon.promotionCustomerId) > -1) || []
        // 对组合优惠的特殊处理, 将其转化成服务端需要的数据格式
        if (!isObjectEmpty(selectedCoupon)) {
            const { promotionCustomerId, sign } = selectedCoupon
            if (promotionCustomerId === sign) {
                selectedCoupon.promotionCustomerId = ''
                selectedCoupon.promotionId = ''
                delete selectedCoupon.canUse
                delete selectedCoupon.selected
            }
        }
        // const selectedExchanges = choseExchanges.map(id =>
        //     mcExchanges.filter(exchange => exchange.promotionCustomerId === id)[0])

        // return [].concat(selectedCoupon, selectedExchanges)
        return [].concat(selectedCoupon)
    },


index.vue

changeCoupon(value) {
            // TODO: [优惠复用] 这里的value应该是卡ID 需要支持多参数
            this.$store.dispatch('changeCoupon', value)
        },

promotionSummary() {
            // TODO: [优惠复用] 如果只有一项已选优惠 则显示这条 否则显示优惠组合
            if (!this.promotionParam || !this.promotionParam.selectedPromotions) {
                return ''
            }
            if (this.promotionParam.selectedPromotions.length === 1) {
                return `${this.promotionParam.selectedPromotions[0].cardName}: ${this.divide100(this.promotionParam.selectedPromotions[0].value)}元`
            }
            let rs = 0
            this.promotionParam.selectedPromotions.forEach((e) => {
                rs += e.value
            })
            return `优惠组合(优惠${this.divide100(rs)}元)`
        },
        hasUnChosenPomotion() {
            // TODO: [优惠复用] 根据优惠字段判断是否还有未选中的优惠(可用的)
            return '还有优惠可叠加使用'
        },


<div class="tip">
            您已选中<span class="red">{{selectedCardPromotions.length}}</span>项优惠，共可抵扣
            <span class="red">
                {{currencySymbol}}
                {{promotionSum}}
            </span>
        </div>


<FButton class="submit" block round @click="togglePromotionsLayer">确认</FButton>


// TODO: 改成由接口返回
        promotionSum() {
            let rs = 0
            this.selectedCardPromotions.forEach((e) => {
                rs += e.value
            })
            return this.divide100(rs)
        },


.tip {
        line-height: 2;
        background: #ec313d33;
        font-size: 12px;
        .red {
            color: red;
        }
    }    


getters.js
    const getRealUnit = (menu) => {
            const {
                doubleUnits,
                accountUnit,
                unit = '', // unit === undefined 情况下最终显示会变成 XNaN (Number + undefined -> NaN)
                num,
                accountNum,
                ...otherProps
            } = menu
            const menuUnit = num + unit
            const menuAccountUnit = accountNum + accountUnit
            if (doubleUnits) {
                return { ...otherProps, menuUnit: `${menuUnit} (${menuAccountUnit})` }
            }
            return { ...otherProps, menuUnit }
        }    




