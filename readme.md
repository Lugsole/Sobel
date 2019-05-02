# Sobel–Feldman operator

These are two examples of the Sobel operator.

these are the steps that it fallows.

1. Black and White
	* this converts the image to a black and white image for analysis
2. Gaussian Filter
	* This is done with Sigma being 1.4
3. Sobel–Feldman operator
	* This is what does edge detection.

## Details of parts
### Black and White
In this part of the picture, there are three channels of the color.
Only one is accepted; so, there needs to be a black and white gradient.
The simples option is taken, and that is to take the average of the three channel and apply that to them all.

```
color = R + G + B /3 
R = color
G = color
b = color
```
### Gaussian Filter

This blurs the image slightly so that there is less graininess. This is performed by adopting the neighboring pixels and forming a new pixel. This is essentially a weighted average with the farther outer edge pixels being used less than the center pixels.

This is the method that the c variant uses.

```
┌─             ─┐
│ 2  4  5  4  2 │
│ 4  9  12 9  4 │     1
│ 5  12 15 12 5 │ * ───── * before = after
│ 4  9  12 9  4 │    159
│ 2  4  5  4  2 │
└─             ─┘
```

# Links
Live server:
https://lugsole.github.io/Sobel/web

https://en.wikipedia.org/wiki/Gaussian_filter

https://en.wikipedia.org/wiki/Sobel_operator
