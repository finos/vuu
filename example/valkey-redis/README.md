# Valkey (Open Source Redis) Example

For more information on Valkey go to [Valkey.io](https://valkey.io)

## Description

This sample is designed to show the Vuu server having a virtualized data table implementation backed by Valkey (Redis, but better)

## How to Run the Example

Prerequisites (on mac, may differ on Linux or Windows): 

* Have Homebrew installed (https://brew.sh/)
* Install Valkey (https://formulae.brew.sh/formula/valkey#default)
* You should have built the UI already in npm as documented in the README.md in the root folder 

Hardware: This has been coded on an m2 Macbook pro with 16Gb RAM. On smaller machines you might want to decrease the total count of records
to fix your core/mem profile. On a machine with more RAM you should be able to go higher than the default 25m rows. 

1. Run the Valkey Server

```bash
/opt/homebrew/opt/valkey/bin/valkey-server /opt/homebrew/etc/valkey.conf
```

2. Run the CreateValkeyDataFile static main. This creates a large text file of data in the ./vuu/target folder to import into Valkey 
```
org.finos.vuu.example.valkey.populate.CreateValKeyDataFile
```
3. Import the data into the locally running Valkey (this follows the value mass insert process https://valkey.io/topics/mass-insertion/) This can take a minute or two. 
```
cat /path/to/checkout/of/vuu/target/valkey-sample-data.txt | valkey-cli --pipe
```
4. Run the ValkeyVuuMain from within the IDE 
```
org.finos.vuu.example.valkey.ValkeyVuuMain
```

## Implementing Filters in Valkey 

| Sample filter                        | Example Implementation in Valkey                                                                                                                                                                                                           | Docco Link |
|--------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------| 
| quantity > 10000                     | ZRANGE quantity.idx 10000 +inf BYSCORE                                                                                                                                                                                                     | https://valkey.io/topics/indexing/ |
| currency = "GBP"                     | ZRANGE currency.idx "[GBP:" + BYLEX LIMIT 0 +inf                                                                                                                                                                                           | https://valkey.io/topics/indexing/ |
| currency starts "GB"                 | ZRANGE myindex "[GB" "[GB\xff" BYLEX //need to check this (this does work)                                                                                                                                                                 | https://valkey.io/topics/indexing/ |
| currency = "GBP" and ric starts "VOD" | There seems to be 2 ways to implemented this, 1 brute force, evaluate 1, then evaluate 2, then look for overlap (not nice), or two create a multifield index. <br/>Another approach might be to use composite indices. Need to check this. | https://valkey.io/topics/indexing/ |

(more to follow)

## Implementing Sorts

Its felt that implementing indices and restricting the fields that people can sort on to one per time is probably the only effective way to enable sorting on datasets > 10m rows. 
We could drop back to brute force, but that would require potentially a lot of cpu power.

A third option would be a compound index, as discussed in the Valkey indexing page. But we'd likely want to restrict that only supported combinations otherwise the in mem size could balloon. 

## Checking Valkey - Useful Commands 

* Open Valkey command line interface, check we can load 100_000 records by key.  
```
#Load the keys between 100_000 and 101_000
ZRANGE order.id.pk 100000 101000 BYSCORE
```
* Load the object from key: 
```
HGETALL order:1
```
* Load the row ids via secondary index:
```
ZRANGE order.currency.idx [: + BYLEX LIMIT 2210000 2211000
```
* Load the rows in an auto complete manner using secondary index:
```
ZRANGE order.currency.idx [GBP: + BYLEX LIMIT 2210000 2211000
```
* Getting the full length of the index: 
```
ZCOUNT order.currency.idx -inf +inf
```
* Getting the length of a filtered index (max 1_000_000) (so we can give some feedback on filter)
```
ZRANGE order.currency.idx [USD: + BYLEX LIMIT 0 1000000
```
* Using an index in reverse (cannot use in ByLex fashion)
```
ZREVRANGE order.currency.idx 0 1000
```


FYI, the data file is stored here by default (FYI)

//data file:
/opt/homebrew/var/db/valkey/dump.rdb


