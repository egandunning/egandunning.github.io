#script to create html from source code. reads source code from the file passed
#as command line arg.

import sys
import os

tab = "  " #change if you want bigger/smaller tabs

def prettify():
    if(len(sys.argv) != 2):
        print("correct usage: python prettycode.py pathToCode.txt")
        return 1
    
    if(not os.path.isfile(sys.argv[1])):
        print("invalid file")
        return 1

    codeFile = os.open(sys.argv[1], "r")

    #read no more than 10KB
    code = codeFile.read(10000)
    codeFile.close()

    print('<div class="code">')
    print(tab + '<code>')
    #todo: print code, prettified
    print(tab + '</code>')
