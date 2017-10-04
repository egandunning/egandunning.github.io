public class Point {

    private float x;
    private float y;

    public Point(float x, float y) {
        this.x = x;
        this.y = y;
    }

    public Point(Point other) {
        this.x = other.getX();
        this.y = other.getY();
    }

    @Override
    public String toString() {
        return this.x +" " +this.y;
    }

    /**
     * Returns a string containing the point data in integer form
     */
    public String toScreenCoords() {
        return (int)this.x + " " + (int)this.y;
    }

    /**
     * vector subtraction
     * @param other the point to subtract
     * @return the result of this - other
     */
    public Point minus(Point other) {
        return new Point(this.x - other.getX(), this.y - other.getY());
    }

    public float getX() {
        return x;
    }

    public void setX(float x) {
        this.x = x;
    }

    public float getY() {
        return y;
    }

    public void setY(float y) {
        this.y = y;
    }
}