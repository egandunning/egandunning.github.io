#Script to generate a new project page.

import sys
import os

###create new project page
def newPage(indexPageFilename):

   #Check command line args
   if(len(sys.argv) != 5):
      print("Incorrect usage!!!")
      print("run the following command to generate a new project page:")
      print("  python newprojscript.py 'filename(no extension)' 'project name' 'link to github repo URL' 'project description'")
      return

   #name of project
   projectName = sys.argv[2]
   #URL for github repo
   githubRepo = sys.argv[3]

   #Check if file exists. if file exists, exit.
   if(os.path.isfile(indexPageFilename)):
      print("The file " + indexPageFilename + " exists, exiting.")
      return
   #otherwise, create new file
   indexPage = open(indexPageFilename, 'w')

   #The content for the new page
   mainContent = '''<!DOCTYPE html><html><head>
   <meta charset="UTF-8">
   <link rel="stylesheet" type="text/css" href="../style/stylesheet.css">
   <title>Egan Dunning</title></head>
   <body>
   <header>
     <script src="header.js"></script>
   </header>
   <div>
     <h2>''' + projectName + '''</h2>
     <ul>
       <li><a href="''' + githubRepo + '''">Github repository</a></li>
     </ul>
     <h3>About Project</h3>
     <p>
       
     </p>
     
     <h3>Download</h3>
     <ul>
       <li>Includes [executable], readme.txt, license.txt</li>
       <li><a href="#">Download now</a> (size)</li>
     </ul>
     <p>
       SHA256 sum:
       <code>checksum</code>
     </p> 
   <footer>
     <script src="footer.js"></script>
   </footer>
   </body>
   </html>'''

   #add content to new page and flush
   indexPage.write(mainContent)
   indexPage.close()


###Add link to new project page to index
def updateIndex(indexPageFilename):

   #Check command line args
   if(len(sys.argv) != 5):
      print("Incorrect usage!!!")
      print("run the following command to generate a new project page:")
      print("  python newprojscript.py 'filename(no extension)' 'project name' 'github repo URL' 'project description'")
      return

   #check if index file exists
   if(not os.path.isfile("projects.html")):
      print("The website broke... projects.html is missing")
      return

   #project description
   projectDesc = sys.argv[4]

   #check if content page exists
   if(not os.path.isfile(indexPageFilename)):
      print("Something went terribly wrong... the new content page is missing")
      return

   indexFile = open("projects.html", "r")

   #read at most a megabyte
   indexContent = indexFile.read(1000000)
   indexFile.close()

   #get content before links
   beforeLinks = indexContent[0:indexContent.find("<ul>")+4]
   #get links and content after links
   links = indexContent[indexContent.find("<ul>")+4:len(indexContent)]
   
   #add link to new project page
   links = '\n    <li><a href="' + indexPageFilename + '">' + projectDesc + '</a></li>' + links

   #update html file
   indexFile = open("projects.html", "w")
   indexFile.write(beforeLinks + links)
   indexFile.close()


#file to put website content in
indexPageFilename = "projects/" + sys.argv[1] + "-index.html"

newPage(indexPageFilename)
updateIndex(indexPageFilename)