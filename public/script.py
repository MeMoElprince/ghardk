import pandas as pd
import numpy as np
from numpy import random
import random
import pandas as pd
import csv
import json
import os


currentDirectory = os.getcwd()
# join 2 path with a function 
# currentDirectory = os.path.join(currentDirectory, 'public')
currentDirectory += '/public/'
data=pd.read_csv(currentDirectory + "all datasets.csv")
data.head()

category_id={
  "Accessories" : 1,
  "candles" : 2,
  "textiles" : 3,
  "pottery and ceramic" : 4,
  "leather" : 5
}
data['category_id'] = data['Category'].map(category_id)

data

data["quantity"]=0
for i in range(len(data)):
  data["quantity"][i]=random.randrange(1,20)


data


data.to_csv(currentDirectory + 'modifiedfile.csv', index=False)
modi=pd.read_csv(currentDirectory + 'modifiedfile.csv')
modi

modi['vendor_id']="NAN"

modi


modi = modi.reindex(columns=['name', 'description', 'category_id','vendor_id','quantity','price','image'])

modi["product_id"]=""
for i in range(len(modi)):
  modi["product_id"][i]=i

modi.to_csv(currentDirectory + 'modifiedfile.csv', index=False)

def csv2json(csv_path,json_path):
    jsonData = {}
    with open(csv_path,encoding='utf-8-sig') as csvfile:
        csvData =csv.DictReader(csvfile)
        for rows in csvData:
            key= rows["product_id"]
            jsonData[key]=rows
    with open(json_path,'w',encoding='utf-8') as jsonfile:
        jsonfile.write(json.dumps(jsonData,indent=10))
    print("Data Converted")

csv_path=r'modifiedfile.csv'
json_path=r'data.json'

csv2json(currentDirectory + csv_path,currentDirectory+json_path)
