"""
@author: vaishnavi apsingkar
"""
"""importing the required libraries"""
import pandas as pd
import os  


"""read raw output csv file generated for the most recent experiment and stored locally in the folder along with old experiments raw csv files"""
#import pandas as pd
#import os

#path = 'C:/Users/vaishnavi apsingkar/js experiment file'
#csvs = [x for x in os.listdir(path) if os.path.isfile(x) and x.endswith(".csv")]
#recent_csv = max(csvs , key=lambda x: os.stat(os.path.join(path,x)).st_mtime)

#df1 = pd.read_csv(recent_csv, delimiter=',')


"""read generated raw csv output file for the experiment """
df1 = pd.read_csv("./input_csv_files/NoLab-Test-jsPsych__PARTICIPANT_SESSION_2023-12-22_11h18.45.455.csv", delimiter=',')


"""drop rows where itemID = null""" 
df1.dropna(subset=['itemID'], inplace=True)


"""create new dataframe with required columns from csv file"""
df2 = df1[['subjectID', 'itemID', 'turn', 'target', 'competitor', 'actor', 'target_file', 'competitor_file', 'actor_file']]



"""rename column headers as per the requirement"""
df2.rename(columns={'target':'target_name','competitor':'competitor_name','actor':'actor_name'}, inplace=True)


"""create organized trial output excel file from raw csv output file"""
#df2.to_excel("Apsingkar-NoLab-test-result.xlsx", index = False)

"""create folder on system to save output file"""
path='./output_files'
try:
    os.mkdir(path)
    print("Folder ",path," created")
except FileExistsError:
    print("Folder ",path," exists")
    

"""create organized trial output excel file from raw csv output file """
"""create pandas Excel writer""" 
writer = pd.ExcelWriter('./output_files/Apsingkar-NoLab-test-result.xlsx') 

"""write a dataframe to the worksheet"""
df2.to_excel(writer, sheet_name='Sheet1', index=False, na_rep='NaN')

"""adjust column width"""
for column in df2:
    column_length = max(df2[column].astype(str).map(len).max(), len(column)) + 2
    col_idx = df2.columns.get_loc(column)
    writer.sheets['Sheet1'].set_column(col_idx, col_idx, column_length)


""" format the column headers with the defined format - left alignment and bold"""
workbook = writer.book
worksheet = writer.sheets['Sheet1']
header_format = workbook.add_format({'align': 'left','bold': True})

for col_num, value in enumerate(df2.columns.values):
    worksheet.write(0, col_num , value, header_format)
    
"""close the Pandas Excel writer"""
"""object and output the Excel file""" 
writer.save()

print("Excel output file has been created")

"""create organized trial output csv file """
df3 = pd.read_excel('./output_files/Apsingkar-NoLab-test-result.xlsx')
df3.to_csv('./output_files/Apsingkar-NoLab-test-result.csv', index=False) 

print("CSV output file has been created")
