import json 
from collections import defaultdict
import numpy as np 

class get_specs:
    def __init__(self, data_schema_file_path='staticdata/birdstrikes_dataset_schema.json') -> None:
        self.recommendations_dict = self.load_precomputed_recommendations('./data/birdstrikes/precomputed_visualizations_zeng_dziban_v2.json')
        self.dataset_schema = self.load_dataset(data_schema_file_path)
        self.config_data = {
            'config': {
                'view': {
                    'continuousHeight': 300,
                    'continuousWidth': 300
                }
            },
            'data': {
                'name': 'data-2ad45d7d002e5134c7eb6f8a0ec71df4'
            } 
        }
        
    def load_precomputed_recommendations(self, file_path):
        try:
            with open(file_path, 'r') as f:
                recommendations_dict = json.load(f)
            return recommendations_dict
        except FileNotFoundError:
            print("Precomputed Dataset Not Found")
            return {}

    def load_dataset(self, file_path):
        with open(file_path, 'r') as f:
            dataset_dict = json.load(f)
        return dataset_dict


    def get_draco_recommendations(self, attributes, datasetname='birdstrikes'):
        ret = [f.replace('__', '_').lower() for f in attributes]
        field_names_renamed = [f.replace('$', 'a') for f in ret]
        field_names_final = [f for f in field_names_renamed if f != 'none']
        
        key = '+'.join(np.sort(field_names_final))
        # print("Key ", key)
        reco = self.recommendations_dict.get(key, {})
        # print(reco, type(reco))        
    
        reco.update(self.config_data)
        reco = json.dumps(reco)
        # print("reco -> ", reco)
        return reco

def get_vgl_from_vglstr(vglstr):
    vgl = {}
    vgl["$schema"] = "https://vega.github.io/schema/vega-lite/v5.8.0.json"
    # vgl["data"] = {"url": "/data/" + dataset + "/" + dataset +".json"}
    mark = vglstr.split(';')[0]
    encoding = vglstr.split(';')[1]
    vgl["mark"] = mark.split(':')[1]
    encodings = {}
    fields = []
    encoding = encoding.split(':')[1]
    encoding_arr = encoding.split(',')
    for encode in encoding_arr:
        one_encoding = {}
        if '<' in encode:
            regular = encode.split('<')[0]
            transform = encode.split('<')[1]

            regular_split = regular.split('-')
            if len(regular_split) != 3:
                print ("something wrong with regular string.")
            field = regular_split[0].lower()
            attr_type = regular_split[1]
            encoding_type = regular_split[2]

            one_encoding["type"] = attr_type
            if field != '':
                one_encoding["field"] = field
                fields.append(field)

            transform_split = transform.split('>')
            transform_type = transform_split[0]
            transform_val = transform_split[1]

            if transform_type == "bin":
                one_encoding["bin"] = True
            else:
                one_encoding[transform_type] = transform_val
            
            #encodings[encoding_type] = one_encoding

        else:
            encode_split = encode.split('-')
            if len(encode_split) != 3:
                print ("something wrong with encode string.")
            
            field = encode_split[0].lower()
            attr_type = encode_split[1]
            encoding_type = encode_split[2]

            one_encoding["type"] = attr_type
            if field != '':
                one_encoding["field"] = field
                fields.append(field)
            else:
                print ("something wrong:")
                print (vglstr)
            
            ## for bs Flight_Date
            if encode == "Flight_Date-nominal-row":
                if "-x" not in vglstr:
                    encoding_type = "x"
                elif "-y" not in vglstr:
                    encoding_type = "y"
                elif "-color" not in vglstr:
                    encoding_type = "color"
                else:
                    encoding_type = "size"
                
            if "Flight_Date-nominal" in encode:
                one_encoding["timeUnit"] = "month"
            
            ## for movie Release_Date
            if encode == "Release_Date-nominal-row":
                if "-x" not in vglstr:
                    encoding_type = "x"
                elif "-y" not in vglstr:
                    encoding_type = "y"
                elif "-color" not in vglstr:
                    encoding_type = "color"
                else:
                    encoding_type = "size"
                
            if "Release_Date-nominal" in encode:
                one_encoding["timeUnit"] = "month"
        
        if "field" in one_encoding:
            if one_encoding["field"] == "Title":
                if encoding_type == "x":
                    vgl["width"] = 3200
                else:
                    vgl["height"] = 18000
            if one_encoding["field"] == "Director" or one_encoding["field"] == "Distributor":
                if encoding_type == "x":
                    vgl["width"] = 3200
            
        encodings[encoding_type] = one_encoding
    
    vgl["encoding"] = encodings
    return vgl

def update_field_values(data):

    for key, value in data.items():
        if isinstance(value, dict):
            update_field_values(value)  # Recurse if value is a nested dictionary
        elif key == "field" and value == "cost_total":
            data[key] = "cost_total_a"  # Update the value if condition is met
        
if __name__ == "__main__":
    read_bs_dizban_flds_to_vglstr = open('./data/birdstrikes/dziban_fields_to_vglstr.json', 'r')
    bs_dziban_flds_to_vglstr = json.load(read_bs_dizban_flds_to_vglstr)

    d = {}
    for fields, charts in bs_dziban_flds_to_vglstr.items():
        fields = fields.lower()
        if 'cost_total' in fields:
            fields = fields.replace("cost_total", "cost_total_a")
        d[fields] = get_vgl_from_vglstr(charts)
        update_field_values(d[fields])
        
            
    for keys, items in d.items():
        print(keys, items)

    with open('./data/birdstrikes/precomputed_visualizations_zeng_dziban.json', 'w') as json_file:
        json.dump(d, json_file, indent=4) 