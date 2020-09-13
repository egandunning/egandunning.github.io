<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Recipes</title>
    </head>
    <body>
      <h1>Recipes</h1>
      <p>Data retrevied from https://esha.com/resources/additional-databases/</p>
      <xsl:for-each select="data/recipe">
        <h2>
          <xsl:value-of select="@description" />
        </h2>
        <h3>Ingredients</h3>
        <table border="1">
          <tr>
            <th>Ingredient</th>
            <th>Quantity</th>
            <th>Units</th>
          </tr>
          <xsl:for-each select="RecipeItem">
            <xsl:variable name="ItemName" select="@ItemName" />
            <xsl:variable name="itemKey" select="@itemKey" />
            <xsl:variable name="mKey" select="@itemMeasureKey" />
            <xsl:variable name="itemYieldKey" select="'@itemYieldKey'" />
            
            <tr>
              <td>
                <xsl:value-of select="@ItemName" />
              </td>
              <td>
                <xsl:value-of select="number(@itemQuantity)" />
              </td>
              <td>
                <xsl:choose>
                  <xsl:when test="$mKey = 1">tsp</xsl:when>
                  <xsl:when test="$mKey = 2">tbsp</xsl:when>
                  <xsl:when test="$mKey = 3">cup</xsl:when>
                  <xsl:when test="$mKey = 5">count</xsl:when>
                  <xsl:when test="$mKey = 6">tsp</xsl:when>
                  <xsl:when test="$mKey = 7">lbs</xsl:when>
                  <xsl:when test="$mKey = 8">g</xsl:when>
                  <xsl:otherwise><xsl:value-of select="$mKey" /></xsl:otherwise>
                </xsl:choose>
              </td>
            </tr>
          </xsl:for-each>
        </table>
        <h3>Steps</h3>
        <pre style="white-space: pre-wrap;">
          <xsl:value-of select="XML_MEMO1" />
        </pre>
      </xsl:for-each>
    </body>
  </html>
</xsl:template>
</xsl:stylesheet>