---
layout: post
title: 【翻译】【MySQL文档@13.3.1】MySQL事务锁相关
date: 2021-08-31 20:18:12 +0800
author: yitimo
categories: mysql, translation
tags: ["mysql", "translation"]
keywords:
- mysql,
- translation,
description: MySQL transaction and lock(Translation for MySQL document Ch-13.3.1).
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

默认的 MySQL 会启用 ``autocommit`` 模式, 即非事务情况下所有语句都会自动提交, 就好像它们都被包了一层 ``START TRANSACTION ... COMMIT``, 所以你不能使用 ``ROLLBACK`` 来回滚改动, 不过语句执行出错时可以实现回滚.

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

MySQL 对 InnoDB 索引的表, 在只读事务中的查询提供了额外优化. 在不能自动识别为只读模式的情况下可以手动开启来得到这些优化.

默认的访问模式是 ``READ/WRITE`` 读写模式. 同一个语句不支持同时制定只读和读写模式.

在只读模式下, 支持使用 DML 语句来修改使用 TEMPORARY 关键词创建的临时表. DDL语句的修改、持久化表则是不被允许的.

更多关于事务访问模式的信息详见 **13.3.7**.

如果开启了只读系统变量, ``START TRANSACTION READ WRITE`` 语句需要``connection`` 的管理权限.

> **重要:** 很多MySQL客户端(比如 JDBC)都封装并提供了他们自己的方法来开启事务, 而不需要直接使用 ``START TRANSACTION`` 语句.

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

``AND CHAIN``语法能在当前事务结束时立即开启一个新事务, 新的事物和原事务拥有相同的隔离等级、读写访问权限. ``RELEASE`` 语法使服务在当前事务结束后断连当前session. 还有 ``NO`` 关键词来禁用 ``CHAIN/RELEASE`` 行为, 当想系统默认开启``completion_type`` 配置时会用到.

开始一个新事务会使所有正在pending的事务被提交, 详见 **13.3.3**.

开始一个新事务同时还会使捕获的表锁被释放, 就好像你自己执行了 ``UNLOCK TABLES``. 开启新事务不会释放全局的读锁(``FLUSH TABLES WITH READ LOCK``得到的).

为了最好的结果, 事务应该只被单事务安全的存储引擎管理的表来使用. 否则可能会有以下问题:

- 如果你用到了来自不止一个单事务安全存储引擎(比如 InnoDB), 且事务隔离等级为 ``SERIALIZABLE``. 当一个事务被提交, 而另一个还未完成的事务看到了被前一个事务修改的值, 此时事务的原子性得不到保证, 而产生了不一致.(如果跨引擎的事务很少用到, 你可以在需要时给每个事务单独设置隔离等级为 ``SERIALIZABLE``).
- 如果你在一个事务里用到了非事务安全的表, 这些表的改动会直接被存储, 即又变成了自动提交模式.
- 如果你在一个事务里更新一个非事务表, 然后抛出 ``ROLLBACK``, 此时会报 ``ER_WARNING_NOT_COMPLETE_ROLLBACK`` 的警告. 事务安全的表会被成功回滚, 而非事务安全的表做不到.

每个事务都被存储在一个二进制日志里, 直到 ``COMMIT``. 被回滚的事务不会被记录. (例外: 非事务的表不能被回滚, 如果被回滚的事务里包含了非事务表的改动, 整个事务会在 ``ROLLBACK`` 语句后被记录, 来确保非事务表的改动是重复的.)

你可以用 ``SET TRANSACTION`` 语句来修改事务的隔离等级和访问模式. 详见 **13.3.7**.

回滚是一个慢操作, 且可能发生用户意料之外的行为. 因此, ``SHOW PROCESSLIST`` 可以用来显示session的State列中的回滚, 这对隐式回滚和主动回滚都有效.

> **注意:** 在 MySQL 8.0 里, BEGIN, COMMIT 和 ROLLBACK 不受 ``--replicate-do-db`` 或 ``--replicate-ignore-db`` 规则影响.

当 ``InnoDB`` 完成了一次事务的回滚, 这次事务设置的所有锁都会被释放. 如果事务里的单个SQL语句由于错误而回滚了, 这条语句里的锁会在事务还存在时保留. 这是因为 ``InnoDB`` 存储不知道行锁究竟是哪条语句设置的.

如果事务里的一个select语句调用了存储方法, 且存储方法里的一条语句时报了, 这次事务会回滚. 如果后续事务又执行了``ROLLBACK``, 整个事务都会被回滚.

## 原文链接

[https://dev.mysql.com/doc/refman/8.0/en/commit.html](https://dev.mysql.com/doc/refman/8.0/en/commit.html)
