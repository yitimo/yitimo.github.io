---
layout: post
title: MySql事务锁相关
date: 2021-08-31 20:18:12 +0800
author: yitimo
categories: mysql
tags: ["mysql"]
keywords:
- mysql,
description: MySql transaction and lock.
---

## START TRANSACTION, COMMIT, 和 ROLLBACK 语法

``` sql
START TRANSACTION
    [transaction_characteristic [, transaction_characteristic] ...]

transaction_characteristic: {
    WITH CONSISTENT SNAPSHOT
  | READ WRITE
  | READ ONLY
}

BEGIN [WORK]
COMMIT [WORK] [AND [NO] CHAIN] [[NO] RELEASE]
ROLLBACK [WORK] [AND [NO] CHAIN] [[NO] RELEASE]
SET autocommit = {0 | 1}
```

这些语法提供了事务(transaction)相关的控制:

- ``START TRANSACTION`` 或 ``BEGIN``: 开始一个新事务
- ``COMMIT``: 提交当前事务, 使其改动真正生效
- ``ROLLBACK``: 回滚当前事务到开始之前
- ``SET autocommit``: 开/关 当前事务的默认自动提交行为

默认的 MySql 会启用 ``autocommit`` 模式, 即非事务情况下所有语句都会自动提交, 就好像它们都被包了一层 ``START TRANSACTION ... COMMIT``, 所以你不能使用 ``ROLLBACK`` 来回滚改动, 不过语句执行出错时可以实现回滚.

可以使用 ``START TRANSACTION`` 语句来禁用一系列语句的自动提交:

``` sql
START TRANSACTION;
SELECT @A:=SUM(salary) FROM table1 WHERE type=1;
UPDATE table2 SET summary=@A WHERE type=1;
COMMIT;
```

使用了 ``START TRANSACTION`` 后, 你就需要手动 ``COMMIT`` 或 ``ROLLBACK`` 来结束你的事务. 然后 自动提交模式 也会恢复原值.

``START TRANSACTION`` 语句支持一些修饰语来控制你的事务, 多个修饰语用逗号隔开:

- ``WITH CONSISTENT SNAPSHOT``: TODO: 待补充
- ``READ WRITE/READ ONLY``: 事务的访问模式, 用来允许或禁止事务中用到的表的修改行为. ``READ ONLY`` 限制用到表的其他事务或非事务只能读而不能写, 当前事务本身能读写.

MySql 对 InnoDB 索引的表, 在只读事务中的查询提供了额外优化. 在不能自动识别为只读模式的情况下可以手动开启来得到这些优化.

默认的访问模式是 ``READ/WRITE`` 读写模式. 同一个语句不支持同时制定只读和读写模式.

在只读模式下, 支持使用 DML 语句来修改使用 TEMPORARY 关键词创建的临时表. DDL语句的修改、持久化表则是不被允许的.

更多关于事务访问模式的信息详见 **13.3.7**.

如果开启了只读系统变量, ``START TRANSACTION READ WRITE`` 语句需要``connection`` 的管理权限.

> **重要:** 很多MySql客户端(比如 JDBC)都封装并提供了他们自己的方法来开启事务, 而不需要直接使用 ``START TRANSACTION`` 语句.

想要显式禁用自动提交模式, 使用以下语句:

``` sql
SET autocommit=0;
```

当设置值为 ``0`` 来禁用自动提交后, 对于事务安全的表的改动都不会立即生效, 你必须手动 ``COMMIT`` 来使其生效, 或 ``ROLLBACK`` 来回滚改动.

autocommit 是一个session级的变量, 故每个session都要设置. 想要禁用所有新连接的自动提交的话, 需要设置到 autocommit 的系统变量.

``BEGIN`` 和 ``BEGIN WORK`` 是 ``START TRANSACTION`` 的别名, 用来初始化一个事务. ``START TRANSACTION`` 是一个标准SQL语句, 是开启一个 ad-hoc 事务和修改器的推荐方式, 而 ``BEGIN`` 不是.

这里的 ``BEGIN`` 语法跟 ``BEGIN ... END`` 混用的情况不同, 后者不会开始一个事务.

> **注意:** 在所有存储的程序里(比如 过程、函数、触发器和事件), 会认为 ``BEGIN`` 是 ``BEGIN ... END`` 块的开始部分. 故请使用 ``START TRANSACTION`` 语法.

可选的 ``WORK`` 关键字也支持 ``COMMIT`` 和 ``ROLLBACK``, 用的是 ``CHAIN`` 和 ``RELEASE``. 这两个语法用来提供事务结束阶段的更多控制. 系统变量 ``completion type`` 定义了默认的结束行为.


