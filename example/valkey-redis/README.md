# Valkey (Open Source Redis) Example

For more information on Valkey go to [Valkey.io](https://valkey.io)

## Description

This sample is designed to show the Vuu server having a virtualized data implementation backed by Valkey (Redis.)

## How to Run the Example

Prerequisites (on mac, may differ on Linux or Windows): 

* Have Homebrew installed 
* Install Valkey (https://formulae.brew.sh/formula/valkey#default)

Hardware: This has been coded on an m2 Macbook pro with 16Gb RAM. On smaller machines you might want to decrease the total count of records
to fix your core/mem profile. On a machine with more RAM you should be able to go higher than the default 25m rows. 

1. Run the Valkey Server

```bash
/opt/homebrew/opt/valkey/bin/valkey-server /opt/homebrew/etc/valkey.conf
```

2. Run the CreateValkeyDataFile static main.
```
org.finos.vuu.example.valkey.populate.CreateValKeyDataFile
```
3. Import the data into the locally running Valkey (this follows the value mass insert process https://valkey.io/topics/mass-insertion/) THis can take a minute or two. 
```
cat /path/to/checkout/of/vuu/target/valkey-sample-data.txt | valkey-cli --pipe
```
4. Open Valkey command line, check we can load 100_000 records by key.  
```
#Load the keys between 100_000 and 101_000
ZRANGE order.id.pk 100000 101000 BYSCORE
```
5. Load the object from key: 
```
HGETALL order:1
```
6. Load the row ids via secondary index:
```
ZRANGE order.currency.idx [: + BYLEX LIMIT 10000 11000
```
7. Load the rows in an auto complete manner using secondary index:
```
ZRANGE order.currency.idx [GBP: + BYLEX LIMIT 10000 11000
```
8. Getting the full length of the index: 
```
ZCOUNT order.currency.idx -inf +inf
```

FYI, the data file is stored here by default (FYI)

//data file:
/opt/homebrew/var/db/valkey/dump.rdb


