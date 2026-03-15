import numpy as np, trimesh  
# Default vertices (a simple rectangle) 
default_verts = np.array([[0,0,0],[1,0,0],[1,1,0],[0,1,0]], dtype=np.float64)  
# Morph target: the 'wide' version 
wide_verts = np.array([[0,0,0],[2,0,0],[2,1,0],[0,1,0]], dtype=np.float64)  
# The DELTA is what gets stored (not the full positions) 
delta = wide_verts - default_verts 
print('Delta:', delta)  # [[0,0,0],[1,0,0],[1,0,0],[0,0,0]]  
# Apply morph at t=0.5 (halfway between default and wide) 
t = 0.5 
blended = default_verts + t * delta 
print('Blended:', blended)  # vertices are 50% wider